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
- **This looks like a shared/hackathon workspace.** The `workspace` catalog
  already has schemas owned by other people (e.g. `workspace.landing`,
  `workspace.metric_views_lab`, owned by `verniermichel36@gmail.com`) —
  leave those alone. Create project resources under their own
  catalog/schema, not inside `workspace`.

## Data status (as of 2026-09-23)

| Source | Status |
|---|---|
| Cadastre | ✅ Ready |
| BDNB (Base Nationale des Bâtiments) | 🔄 Ingestion ongoing — don't assume it's queryable yet, check before building on it |
| PLU (Plan Local d'Urbanisme) documents / vector DB | ❌ Not started — needs sourcing + indexing |

As of this check, the `dbc-1006` workspace has **no project-specific catalog
and no deployed app yet** — this is a greenfield build. Confirm current
state with `databricks catalogs list --profile dbc-1006` before assuming
anything above is stale.

## Planned architecture

Not yet provisioned — confirm naming with the team before creating anything.
The mockup's mock data implies this shape, treat it as a *starting proposal*:

- **Unity Catalog**: a project catalog (name TBD, mockup mock data uses
  `foncier`) with schemas `bdnb`, `cadastre`, `plu`, and a `gold` schema
  holding a joined table (mockup calls it `gold.batiments_plu`) that backs
  the NL→SQL assistant.
- **Vector Search** index over the PLU documents, for RAG-based zoning-rule
  lookup.
- **Agent Bricks Supervisor Agent** orchestrating two sub-agents behind the
  "Assistant territoire" chat: a text-to-SQL/analytics agent over the
  BDNB+cadastre gold table, and a RAG agent over the PLU vector index.
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
