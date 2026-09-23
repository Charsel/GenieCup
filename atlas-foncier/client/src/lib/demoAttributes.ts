// Illustrative attributes for 3 real buildings in the démo périmètre (Paris 13e,
// Chevaleret - Tolbiac). Geometry/location come from the real cadastre ingestion
// (Chantier 1); BDNB/PLU numbers below are placeholder estimates for the demo,
// clearly labeled as such in the UI — they will be replaced once BDNB and PLU
// zonage land in workspace.gold.batiments_plu.

export interface DemoAttributes {
  adresse: string;
  zone_plu: string;
  plafond_hauteur_m: number;
  hauteur_m: number;
  dpe_classe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  conso_kwh_m2_an: number;
  emprise_m2: number;
  niveaux: number;
  niveaux_max: number;
  usage: string;
  sdp_existante_m2: number;
}

export const DEMO_BUILDINGS: Record<string, DemoAttributes> = {
  '56103-0': {
    adresse: '12 rue Chevaleret',
    zone_plu: 'UG',
    plafond_hauteur_m: 25,
    hauteur_m: 18.5,
    dpe_classe: 'F',
    conso_kwh_m2_an: 320,
    emprise_m2: 780,
    niveaux: 6,
    niveaux_max: 8,
    usage: 'Logement + commerce en RDC',
    sdp_existante_m2: 4200,
  },
  '56088-0': {
    adresse: '8 rue de Tolbiac',
    zone_plu: 'UG',
    plafond_hauteur_m: 28,
    hauteur_m: 22,
    dpe_classe: 'D',
    conso_kwh_m2_an: 210,
    emprise_m2: 650,
    niveaux: 7,
    niveaux_max: 9,
    usage: 'Bureaux',
    sdp_existante_m2: 3900,
  },
  '55147-0': {
    adresse: "45 rue Jeanne d'Arc",
    zone_plu: 'UGSU',
    plafond_hauteur_m: 31,
    hauteur_m: 15,
    dpe_classe: 'G',
    conso_kwh_m2_an: 380,
    emprise_m2: 420,
    niveaux: 4,
    niveaux_max: 10,
    usage: 'Activité / entrepôt',
    sdp_existante_m2: 1600,
  },
};

export const DEMO_BUILDING_IDS = Object.keys(DEMO_BUILDINGS);

/** Formule "surélévation" telle qu'utilisée par l'Assistant territoire. */
export function computeSurelevationM2(attrs: DemoAttributes): number {
  return Math.round(attrs.emprise_m2 * (attrs.niveaux_max - attrs.niveaux) * 0.88);
}

export function isPassoireThermique(dpe: string): boolean {
  return dpe === 'F' || dpe === 'G';
}
