-- Bâtiments du périmètre de démonstration (Paris 13e, îlots Chevaleret - Tolbiac).
-- Géométrie/commune : cadastre réel (Chantier 1). Colonnes BDNB (adresse, hauteur_m,
-- dpe_classe, ges_classe, annee_construction, nombre_logements, type_batiment,
-- emprise_au_sol_m2) : réelles pour les bâtiments matchés (~88% du périmètre) via
-- un rapprochement spatial cadastre <-> BDNB, NULL sinon (pas de correspondance).
-- Colonnes PLU (zone_plu, plafond_hauteur_m, sdp_residuelle_m2) : NULL tant que
-- le zonage PLU structuré n'est pas branché (Chantier 2).
SELECT
  batiment_groupe_id,
  commune_insee,
  centroid_lon,
  centroid_lat,
  geometry_geojson,
  adresse,
  hauteur_m,
  dpe_classe,
  ges_classe,
  annee_construction,
  nombre_logements,
  type_batiment,
  emprise_au_sol_m2,
  zone_plu,
  plafond_hauteur_m,
  sdp_residuelle_m2
FROM workspace.gold.batiments_plu
WHERE commune_insee = '75113'
  AND centroid_lon BETWEEN 2.365 AND 2.378
  AND centroid_lat BETWEEN 48.822 AND 48.830
