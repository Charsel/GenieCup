"""Génération d'image du volume constructible (Chantier 4).

Deux briques indépendantes de Databricks, testables en local :
- ``build_prompt`` : transforme les attributs BDNB/PLU d'un bâtiment en prompt texte ;
- ``generate_image`` : appelle l'API Gemini (génération d'image) et renvoie le PNG en base64.

Le wrapper MLflow (``model.py``) ne fait qu'enchaîner les deux.
"""

from __future__ import annotations

import os
from typing import Any

import requests

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = "gemini-3-pro-image-preview"
DEFAULT_IMAGE_SIZE = "2K"
DEFAULT_ASPECT_RATIO = "16:9"
TIMEOUT_S = 180

VUES = {
    "aerienne": (
        "Aerial 3/4 bird's-eye view from about 80 m high, looking down on the city block"
    ),
    "pieton": (
        "Street-level pedestrian view from the opposite sidewalk, eye height 1.6 m, "
        "slight upward angle"
    ),
}


def _num(value: Any) -> float | None:
    """Convertit en float, en ignorant None/NaN/chaînes vides (lignes pandas partielles)."""
    if value is None or value == "":
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    return None if f != f else f  # NaN


def _fmt(value: float) -> str:
    return f"{value:g}"


def build_prompt(params: dict[str, Any]) -> str:
    """Construit le prompt de rendu à partir des attributs du bâtiment.

    Clés reconnues (toutes optionnelles) : ``prompt`` (texte libre, prioritaire s'il est
    seul), ``vue`` ("aerienne" | "pieton"), ``adresse``, ``usage``, ``hauteur_m``,
    ``plafond_hauteur_m``, ``emprise_m2``, ``niveaux``, ``niveaux_max``, ``zone_plu``.
    """
    free_text = (params.get("prompt") or "").strip()
    vue = (params.get("vue") or "aerienne").strip().lower()
    if vue not in VUES:
        raise ValueError(f"vue inconnue : {vue!r} (attendu : {', '.join(VUES)})")

    hauteur = _num(params.get("hauteur_m"))
    plafond = _num(params.get("plafond_hauteur_m"))
    emprise = _num(params.get("emprise_m2"))
    niveaux = _num(params.get("niveaux"))
    niveaux_max = _num(params.get("niveaux_max"))
    usage = (params.get("usage") or "").strip()
    adresse = (params.get("adresse") or "").strip()
    zone = (params.get("zone_plu") or "").strip()

    has_building = any(v is not None for v in (hauteur, plafond, emprise, niveaux, niveaux_max))
    if free_text and not has_building:
        return free_text

    lines = [
        "Photorealistic architectural visualization of a densification project "
        "in Paris, France (dense Haussmannian urban block).",
        VUES[vue] + ".",
    ]
    if adresse:
        lines.append(f"Location: {adresse}.")
    existing = []
    if usage:
        existing.append(f"{usage} use")
    if hauteur is not None:
        existing.append(f"{_fmt(hauteur)} m tall")
    if niveaux is not None:
        existing.append(f"{_fmt(niveaux)} storeys")
    if emprise is not None:
        existing.append(f"footprint about {_fmt(emprise)} m²")
    if existing:
        lines.append("Existing building: " + ", ".join(existing) + ".")

    if plafond is not None or niveaux_max is not None:
        target = []
        if niveaux_max is not None:
            target.append(f"{_fmt(niveaux_max)} storeys in total")
        if plafond is not None:
            target.append(f"reaching the zoning height limit of {_fmt(plafond)} m")
        extra = ""
        if niveaux is not None and niveaux_max is not None and niveaux_max > niveaux:
            extra = f" ({_fmt(niveaux_max - niveaux)} added storeys)"
        lines.append(
            "Show the maximum buildable volume as a rooftop extension (surélévation)"
            f"{extra}: " + ", ".join(target) + "."
        )
        lines.append(
            "The new storeys use a contemporary light timber and glass facade, clearly "
            "distinguishable from the original stone building, set back slightly from "
            "the street line; the existing floors stay unchanged."
        )
    if zone:
        lines.append(f"Local zoning (PLU) zone: {zone}.")
    lines.append(
        "Neighbouring buildings at their current heights, soft daylight, realistic "
        "materials, no text, no labels, no watermark."
    )
    if free_text:
        lines.append(free_text)
    return " ".join(lines)


def generate_image(
    prompt: str,
    *,
    api_key: str | None = None,
    model: str | None = None,
    image_size: str | None = None,
    aspect_ratio: str | None = None,
    session: requests.Session | None = None,
) -> dict[str, str]:
    """Appelle Gemini et renvoie ``{"image_base64", "mime_type", "model"}``."""
    api_key = api_key or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY manquante")
    model = model or os.environ.get("IMAGE_GENERATION_MODEL") or DEFAULT_MODEL
    image_size = image_size or os.environ.get("IMAGE_GENERATION_IMAGE_SIZE") or DEFAULT_IMAGE_SIZE
    aspect_ratio = (
        aspect_ratio or os.environ.get("IMAGE_GENERATION_ASPECT_RATIO") or DEFAULT_ASPECT_RATIO
    )

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": aspect_ratio, "imageSize": image_size},
        },
    }
    http = session or requests
    resp = http.post(
        f"{API_BASE}/{model}:generateContent",
        headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
        json=body,
        timeout=TIMEOUT_S,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Gemini HTTP {resp.status_code} : {resp.text[:500]}")

    data = resp.json()
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return {
                    "image_base64": inline["data"],
                    "mime_type": inline.get("mimeType") or inline.get("mime_type") or "image/png",
                    "model": model,
                }
    reason = (data.get("promptFeedback") or {}).get("blockReason") or (
        (data.get("candidates") or [{}])[0].get("finishReason")
    )
    raise RuntimeError(f"Gemini n'a renvoyé aucune image (raison : {reason})")
