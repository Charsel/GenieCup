"""Test local de la génération, sans Databricks : ``uv run try_local.py [aerienne|pieton]``.

Lit la clé dans ``.env`` et écrit l'image dans ``out/``.
"""

import base64
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent

try:  # réseau d'entreprise avec inspection TLS : utiliser le magasin de certificats Windows
    import truststore

    truststore.inject_into_ssl()
except ImportError:
    pass

for line in (HERE / ".env").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.lstrip().startswith("#"):
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"'))

from image_gen import build_prompt, generate_image  # noqa: E402

DEMO = {
    "adresse": "Rue du Chevaleret, Paris 13e",
    "usage": "residential",
    "hauteur_m": 18,
    "plafond_hauteur_m": 31,
    "emprise_m2": 420,
    "niveaux": 6,
    "niveaux_max": 9,
    "zone_plu": "UG",
}

if __name__ == "__main__":
    vue = sys.argv[1] if len(sys.argv) > 1 else "aerienne"
    prompt = build_prompt({**DEMO, "vue": vue})
    print("Prompt :", prompt, "\n")
    t0 = time.time()
    result = generate_image(prompt)
    out = HERE / "out" / f"demo_{vue}.png"
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(result["image_base64"]))
    print(f"{result['model']} | {result['mime_type']} | {time.time() - t0:.1f}s -> {out}")
