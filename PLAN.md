# Plan de répartition — Atlas Foncier

*23 septembre 2026 · Raphaël Gallet*

Cinq chantiers peuvent avancer en parallèle. Le cadastre est ingéré
(`workspace.cadastre.batiments`, 110 562 bâtiments) avec une vue gold au
schéma stable prête pour les autres chantiers ; la BDNB est en cours
d'ingestion ailleurs ; le reste (PLU, agents, génération IA, front) démarre
de zéro dans le workspace `dbc-1006`.

## Chantier 1 — Fondations données (Unity Catalog) ✅ cadastre fait

**Objectif** : ingérer BDNB et cadastre dans Unity Catalog, avec une table
gold jointe (`workspace.gold.batiments_plu`) qui expose hauteur, plafond PLU,
DPE et SDP résiduelle par bâtiment — c'est la table que l'assistant NL→SQL et
le front interrogent.

**Fait** :
- `workspace.cadastre.batiments` — 110 562 bâtiments (empreintes), les 20
  arrondissements de Paris, depuis `workspace.landing.cadastre` (GeoJSON en
  ndjson, une Feature par ligne).
- `workspace.bdnb` — schéma créé, vide (ingestion BDNB toujours en cours
  ailleurs).
- `workspace.gold.batiments_plu` — vue au contrat stable (13 colonnes) :
  colonnes géométrie/commune réelles, colonnes issues de BDNB/PLU
  (`hauteur_m`, `dpe_classe`, `plafond_hauteur_m`, `sdp_residuelle_m2`, …) en
  `NULL` en attendant ces sources.

**Convention confirmée** : catalogue unique `workspace` (pas de catalogue
`foncier` séparé — c'était une hypothèse initiale, l'espace de travail est
partagé). `workspace.landing.<source>` pour le brut, `workspace.<source>`
pour le traité, `workspace.gold` pour les tables/vues jointes.

**Reste à faire** : brancher `workspace.bdnb` dans la vue gold dès que
l'ingestion BDNB est terminée (remplacer les colonnes `NULL` par le vrai
join, sans changer les noms de colonnes).

**Bloque** : Chantier 3 (agent SQL) et la bascule du Chantier 5 vers des
données réelles — mais les deux peuvent déjà commencer contre le schéma
stable de `workspace.gold.batiments_plu`.

## Chantier 2 — PLU et Vector Search

**Objectif** : sourcer les documents PLU (règlement de zone, textes), les
parser (ex. `ai_parse_document`) et construire un index Vector Search dessus
pour la recherche sémantique sur les règles d'urbanisme.

**Départ** : pas commencé — les documents PLU source restent à identifier et
récupérer.

**Livrable** : index Vector Search interrogeable, retournant les extraits de
règlement pertinents pour une parcelle/zone donnée.

**Bloque** : l'agent RAG du Chantier 3, et l'onglet PLU du front s'il doit
citer le texte réglementaire réel.

## Chantier 3 — Agents (Supervisor Agent Bricks)

**Objectif** : construire (1) un agent texte-vers-SQL sur la table gold du
Chantier 1, (2) un agent RAG sur l'index PLU du Chantier 2, et (3) un
Supervisor Agent (Agent Bricks) qui route la question de l'utilisateur vers
le bon sous-agent — c'est le moteur derrière le panneau « Assistant
territoire ».

**Départ** : peut démarrer dès maintenant sur l'architecture et le prompt du
superviseur avec des réponses de démo ; le branchement final dépend des
Chantiers 1 et 2.

**Livrable** : un endpoint conversationnel unique branché sur l'assistant du
front.

## Chantier 4 — Génération IA (Model Serving)

**Objectif** : un endpoint Model Serving (génération d'image) qui prend un
prompt dérivé de la BDNB et du PLU (hauteur, emprise, usage) et retourne un
rendu aérien ou piéton du volume constructible — l'onglet « Génération IA »
de la maquette.

**Départ** : indépendant des autres chantiers, peut être développé et testé
isolément avec des prompts de démo.

**Livrable** : endpoint testable qui retourne une image à partir d'un prompt
texte.

## Chantier 5 — App front-end (AppKit) ✅ premier build fait

**Objectif** : reconstruire l'app à partir de la maquette
(`maquettes/Atlas Foncier · prototype interactif-html/Main.dc.html`) en
AppKit (TypeScript/React) : écran carte, fiche parcelle à 4 onglets, chat
« Assistant territoire ».

**Fait** — app AppKit scaffoldée dans `atlas-foncier/` :
- Carte réelle (react-leaflet + OpenStreetMap, pas de clé requise) affichant
  les 960 vrais bâtiments du périmètre de démo (Paris 13e, Chevaleret –
  Tolbiac) depuis `workspace.gold.batiments_plu`, avec bascule de couche
  Usages / DPE / Potentiel.
- Panneau KPI avec le vrai compte de bâtiments ; mutables/m² à créer affichés
  honnêtement en attente (BDNB requis).
- Fiche parcelle à 4 onglets (BDNB, PLU, Capacité, Génération IA) : 3
  bâtiments réels du périmètre portent des attributs d'exemple étiquetés
  « données de démonstration » ; les 957 autres affichent un état vide
  honnête (« pas encore de données pour ce bâtiment »).
- Chat « Assistant territoire » en mode démo (logique NL→SQL simulée sur les
  3 parcelles d'exemple, SQL généré affiché), clairement marqué comme
  provisoire en attendant le Supervisor Agent (Chantier 3).
- `databricks apps validate` passe (lint, typecheck, build, tests).

**Reste à faire** : déployer (demande confirmation avant tout déploiement),
puis brancher progressivement les vraies données/agents au fur et à mesure
des autres chantiers (Chantier 1 pour BDNB, Chantier 3 pour le chat,
Chantier 4 pour la génération).

## Dépendances et séquencement

| Chantier | Dépend de | Démarrage |
| --- | --- | --- |
| 1. Fondations données | — | Cadastre fait, schéma gold stable ; BDNB déjà en cours |
| 2. PLU & Vector Search | Sourcing des documents PLU | Immédiat, en parallèle |
| 3. Agents (Supervisor) | 1 pour l'agent SQL, 2 pour l'agent RAG | Archi/prompt immédiats, branchement final après 1 et 2 |
| 4. Génération IA | — | Immédiat, indépendant |
| 5. App front-end | Rien pour démarrer (données de démo) ; 1, 3, 4 pour brancher le réel | Immédiat avec les données de démo |

Point de synchronisation recommandé : suivre l'avancement de 1 et 2 en
priorité, car ils bloquent le branchement final de 3 ; figer le schéma de la
table gold du Chantier 1 tôt pour que le Chantier 5 puisse s'y brancher sans
rework.
