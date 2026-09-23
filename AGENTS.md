# AGENTS.md — GenieCup / Atlas Foncier

Guidance for any coding agent (Claude Code, Cursor, etc.) working in this repo.
Read this before touching Databricks resources — it exists so agents stop
guessing which profile, catalog, or resources to use.

## What this project is

**Atlas Foncier**: a tool for property developers working on dense urban
blocks with old building stock, addressing two problems at once:

1. **Énergétique** — identifying buildings that need thermal renovation
   (DPE classes, `passoires thermiques` = F/G-rated buildings).
2. **Pénurie de logements** — finding densification potential (mutable
   parcels, height/floor-area headroom under PLU zoning, surélévation).

A visual reference mockup lives at
[`maquettes/Atlas Foncier · prototype interactif-html/Main.dc.html`](maquettes/Atlas%20Foncier%20%C2%B7%20prototype%20interactif-html/Main.dc.html)
(serve the folder, e.g. `python3 -m http.server`, and open it — don't open
via `file://`). It's a **design reference only**, not production code: reuse
its exact colors/spacing/copy, not its markup. It shows:

- **Map view**: layer toggles (Usages / DPE / Potentiel), a chat panel
  ("Assistant territoire" — NL question → SQL over Unity Catalog), and a
  KPI panel (bâtiments / mutables / m² à créer).
- **Parcel view**, 4 tabs per building: **BDNB** (fiche bâtiment), **PLU**
  (règles d'urbanisme applicables), **Capacité** (SDP existante vs. max PLU
  vs. résiduelle), **Génération IA** (rendu génératif du volume
  constructible via un Model Serving endpoint).

## Databricks workspace & profile

- **Use profile `dbc-1006`** (`https://dbc-1006f51d-8881.cloud.databricks.com`).
  This was chosen explicitly by the project owner — **do not switch profiles
  or auto-select one.** Other profiles (`DEFAULT`, `OAUTH`) exist on this
  machine but are unrelated to this project.
- Always pass `--profile dbc-1006` explicitly to every `databricks` CLI
  command (each shell command runs in its own session, so `export`-ing the
  profile in one command does not carry over to the next).
- **This is a shared/hackathon workspace — there is no separate project
  catalog.** Everything lives under the single `workspace` catalog, alongside
  other teams' schemas. Raw source files land in `workspace.landing.<source>`
  volumes (already created by teammates: `workspace.landing.cadastre`,
  `workspace.landing.bdnb`, `workspace.landing.plu`, owned by
  `nico.ancey@gmail.com` / `verniermichel36@gmail.com`). Processed tables go
  in `workspace.<source>` schemas (e.g. `workspace.cadastre`, `workspace.bdnb`),
  and joined tables/views for the app and agents go in `workspace.gold`. This
  is the real, confirmed convention — **use `workspace.<source>`, not a
  `foncier` catalog** (that was an earlier guess from the mockup's mock data,
  now superseded). Other people are actively creating schemas here too (a
  `workspace.silver` schema appeared mid-session, not ours) — check
  `databricks schemas list workspace --profile dbc-1006` before assuming
  what exists.

## Data status (as of 2026-09-23)

| Source | Status |
|---|---|
| Cadastre | ✅ Done — `workspace.cadastre.batiments` (110,562 building footprints, all 20 Paris arrondissements), ingested from `workspace.landing.cadastre/cadastre-75-batiments.geojson` (newline-delimited GeoJSON, one Feature per line — not a FeatureCollection) |
| BDNB (Base Nationale des Bâtiments) | 🔄 Ingestion ongoing elsewhere — `workspace.landing.bdnb` volume exists but is still empty; `workspace.bdnb` schema is created and ready to receive it |
| PLU (Plan Local d'Urbanisme) | 🔄 `workspace.landing.plu/plu_chunks_paris.parquet` already landed (looks pre-chunked for RAG) — not yet indexed in Vector Search, and zoning attribute data (height caps, coverage %) not yet in table form |
| `workspace.gold.batiments_plu` view | ✅ Created — stable 13-column contract (`batiment_groupe_id`, `hauteur_m`, `dpe_classe`, `plafond_hauteur_m`, `sdp_residuelle_m2`, …). Geometry/commune columns are real; BDNB/PLU-derived columns are `NULL` placeholders until those sources land — swap them for real joins then, don't change the column names |

## Planned architecture

- **Unity Catalog** (confirmed): `workspace.landing.*` (raw volumes) →
  `workspace.cadastre` / `workspace.bdnb` (parsed per-source tables) →
  `workspace.gold.batiments_plu` (joined view backing the NL→SQL assistant).
- **Vector Search** index over `workspace.landing.plu/plu_chunks_paris.parquet`
  for RAG-based zoning-rule lookup (chunks already exist, index does not yet).
- **Agent Bricks Supervisor Agent** orchestrating two sub-agents behind the
  "Assistant territoire" chat: a text-to-SQL/analytics agent over
  `workspace.gold.batiments_plu`, and a RAG agent over the PLU vector index.
- **Model Serving** endpoint for the "Génération IA" tab's image rendering.
- **Databricks App** (AppKit — TypeScript/React) as the front end,
  reimplementing the mockup with real data.

## Working conventions

- Load the `databricks-core` skill first for any Databricks CLI/auth work,
  then the matching product skill: `databricks-lakebase`,
  `databricks-vector-search`, `databricks-agent-bricks`, `databricks-apps`,
  `databricks-unity-catalog`.
- Never auto-select a profile, catalog, or schema — ask, or check what
  already exists (`databricks auth profiles`, `databricks catalogs list`,
  `databricks schemas list <catalog>`) before assuming.
- Unity Catalog CLI subcommands use **positional args**, not flags:
  `databricks schemas list <CATALOG>`, `databricks tables list <CATALOG> <SCHEMA>`.

## Repo layout

- [`README.md`](README.md) — one-paragraph project pitch.
- [`maquettes/`](maquettes/) — design reference mockup (see above).
- [`prompts/generate_app.txt`](prompts/generate_app.txt) — the DevHub
  "build wizard" bootstrap prompt used to kick off this project with an
  AI coding agent.
