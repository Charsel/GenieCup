# Plan de répartition — Atlas Foncier

*23 septembre 2026 · Raphaël Gallet*

Cinq chantiers peuvent avancer en parallèle : le cadastre est prêt, la BDNB
est en cours d'ingestion, et rien n'est encore provisionné dans le workspace
`dbc-1006` (pas de catalogue projet, pas d'app déployée).

## Chantier 1 — Fondations données (Unity Catalog)

**Objectif** : ingérer BDNB et cadastre dans Unity Catalog, avec une table
gold jointe (ex. `gold.batiments_plu`) qui expose hauteur, plafond PLU, DPE
et SDP résiduelle par bâtiment — c'est la table que l'assistant NL→SQL et le
front interrogent.

**Départ** : cadastre prêt, BDNB en cours d'ingestion.

**Livrable** : tables Unity Catalog interrogeables, schéma stabilisé.

**Bloque** : Chantier 3 (agent SQL) et la bascule du Chantier 5 vers des
données réelles.

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

## Chantier 5 — App front-end (AppKit)

**Objectif** : reconstruire l'app à partir de la maquette
(`maquettes/Atlas Foncier · prototype interactif-html/Main.dc.html`) en
AppKit (TypeScript/React) : écran carte, fiche parcelle à 4 onglets, chat
« Assistant territoire ».

**Départ** : peut démarrer immédiatement avec les données de démo déjà
présentes dans le mockup, sans attendre les autres chantiers.

**Livrable** : Databricks App déployée, d'abord avec données de démo puis
branchée sur les vrais services au fur et à mesure (Chantier 1 pour les
données, Chantier 3 pour le chat, Chantier 4 pour la génération).

## Dépendances et séquencement

| Chantier | Dépend de | Démarrage |
| --- | --- | --- |
| 1. Fondations données | — | Cadastre immédiat, BDNB déjà en cours |
| 2. PLU & Vector Search | Sourcing des documents PLU | Immédiat, en parallèle |
| 3. Agents (Supervisor) | 1 pour l'agent SQL, 2 pour l'agent RAG | Archi/prompt immédiats, branchement final après 1 et 2 |
| 4. Génération IA | — | Immédiat, indépendant |
| 5. App front-end | Rien pour démarrer (données de démo) ; 1, 3, 4 pour brancher le réel | Immédiat avec les données de démo |

Point de synchronisation recommandé : suivre l'avancement de 1 et 2 en
priorité, car ils bloquent le branchement final de 3 ; figer le schéma de la
table gold du Chantier 1 tôt pour que le Chantier 5 puisse s'y brancher sans
rework.
