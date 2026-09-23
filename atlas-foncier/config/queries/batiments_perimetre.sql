-- Bâtiments du périmètre de démonstration (Paris 13e, îlots Chevaleret - Tolbiac).
-- Colonnes géométrie/commune réelles (Chantier 1). Colonnes issues de BDNB/PLU
-- (hauteur_m, dpe_classe, plafond_hauteur_m, sdp_residuelle_m2, ...) sont NULL
-- tant que ces sources ne sont pas branchées dans workspace.gold.batiments_plu.
SELECT
  batiment_groupe_id,
  commune_insee,
  centroid_lon,
  centroid_lat,
  geometry_geojson,
  adresse,
  hauteur_m,
  dpe_classe,
  conso_kwh_m2_an,
  sdp_existante_m2,
  zone_plu,
  plafond_hauteur_m,
  sdp_residuelle_m2
FROM workspace.gold.batiments_plu
WHERE commune_insee = '75113'
  AND centroid_lon BETWEEN 2.365 AND 2.378
  AND centroid_lat BETWEEN 48.822 AND 48.830
