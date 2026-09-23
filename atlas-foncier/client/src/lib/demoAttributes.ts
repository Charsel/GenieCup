// Illustrative attributes and AI generation variants for buildings in the démo périmètre (Paris 13e).

export interface AiVariant {
  id: 'A' | 'B' | 'C';
  title: string;
  style: string;
  sdp: number;
  emprise: number;
  h: number;
  niv: number;
  logts: number;
  aerialImg: string;
  streetImg: string;
  prompt: string;
}

export interface DemoAttributes {
  id: string;
  key?: 'entrepot' | 'garage' | 'station';
  name?: string;
  hero?: boolean;
  adresse: string;
  parcelle: string;
  bdnb_id: string;
  zone?: string;
  zone_plu: string;
  plafond_hauteur_m: number;
  hauteur_m: number;
  dpe_classe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  conso_kwh_m2_an: number;
  ges_kgco2_m2_an: number;
  annee_construction: number;
  emprise_m2: number;
  niveaux: number;
  niveaux_max: number;
  usage: string;
  usage_type: 'commerce' | 'logement' | 'bureaux' | 'activite' | 'equipement';
  sdp_existante_m2: number;
  sdp_max_plu_m2: number;
  sdp_residuelle_m2: number;
  mutable: boolean;
  ptype: 'Surélévation' | 'Mutation de parcelle' | 'Densification';
  logts_potentiels: number;
  murs: string;
  chauffage: string;
  rules: Array<{ k: string; rule: string; cur: string; st: 'Conforme' | 'Surélévation possible' | 'Non conforme' }>;
  variants?: AiVariant[];
}

export const HERO_BUILDINGS: Record<string, DemoAttributes> = {
  // 1. Entrepôt Chevaleret / Boulevard Vincent-Auriol
  '55147-0': {
    id: '55147-0',
    key: 'entrepot',
    name: 'Entrepôt Chevaleret',
    hero: true,
    adresse: 'Boulevard Vincent-Auriol',
    parcelle: '75113 000 AD 0167',
    bdnb_id: 'bdnb-bg-9Y8K-MN42-P9LX',
    zone_plu: 'UGSU',
    plafond_hauteur_m: 35.2,
    hauteur_m: 8.5,
    dpe_classe: 'G',
    conso_kwh_m2_an: 440,
    ges_kgco2_m2_an: 89,
    annee_construction: 1964,
    emprise_m2: 680,
    niveaux: 2,
    niveaux_max: 11,
    usage: 'Activité / entrepôt logistique',
    usage_type: 'activite',
    sdp_existante_m2: 1250,
    sdp_max_plu_m2: 6500,
    sdp_residuelle_m2: 5250,
    mutable: true,
    ptype: 'Mutation de parcelle',
    logts_potentiels: 82,
    murs: 'Structure métallique et bardage',
    chauffage: 'Aérothermie fioul vétuste',
    rules: [
      { k: 'Gabarit de hauteur', rule: 'Plafond 35,2 m', cur: '8,5 m', st: 'Surélévation possible' },
      { k: 'Emprise au sol max', rule: '65 % de la parcelle', cur: '72 %', st: 'Surélévation possible' },
      { k: 'Pleine terre / végétalisation', rule: '30 % min.', cur: '0 %', st: 'Non conforme' },
      { k: 'Destination prioritaire', rule: 'Mixité sociale & Logement', cur: 'Activité', st: 'Non conforme' },
    ],
    variants: [
      {
        id: 'A',
        title: 'Plot compact & attique',
        style: 'Béton bas carbone clair, loggias filantes, attique végétalisé',
        sdp: 6146,
        emprise: 55,
        h: 35.2,
        niv: 11,
        logts: 88,
        aerialImg: '/assets/864528cc6f5805a3a1175209e7ea2bc6.jpg',
        streetImg: '/assets/6ce929c76a2fb7ca48979a6731ef55e2.jpg',
        prompt: 'Volumétrie contemporaine R+10 à Paris 13e, béton clair matricé, baies vitrées profondes, commerces double hauteur en RDC, ciel de fin de journée, rendu architectural photoréaliste.',
      },
      {
        id: 'B',
        title: 'Gradins végétalisés',
        style: 'Structure mixte bois-béton, terrasses en cascade, cœur d’îlot arboré',
        sdp: 5306,
        emprise: 64,
        h: 35.2,
        niv: 11,
        logts: 76,
        aerialImg: '/assets/7cbd0c53c9592e9a53a7d46a624c5ad1.jpg',
        streetImg: '/assets/c09974587305cff32aad4599cd87860d.jpg',
        prompt: 'Immeuble résidentiel en gradins successifs orientés sud-ouest, coursives bois et végétation dense, conforme au PLU bioclimatique de Paris, lumière naturelle rasante.',
      },
      {
        id: 'C',
        title: 'Dualité Bois & Verre',
        style: 'Façades double peau vitrée, brise-soleil en mélèze, toiture active',
        sdp: 5820,
        emprise: 58,
        h: 35.2,
        niv: 11,
        logts: 84,
        aerialImg: '/assets/065f7c06d97e87183dc3dae32c6261a2.jpg',
        streetImg: '/assets/c038e6c78e429d79a64285ca184d44a5.jpg',
        prompt: 'Élévation contemporaine sur rue parisienne, ossature bois lamellé-collé apparente, toiture terrasse productive avec panneaux photovoltaïques et serre partagée.',
      },
    ],
  },

  // 2. Garage Tolbiac / Rue Clisson
  '56088-0': {
    id: '56088-0',
    key: 'garage',
    name: 'Garage Tolbiac',
    hero: true,
    adresse: 'Rue Clisson',
    parcelle: '75113 000 AD 0278',
    bdnb_id: 'bdnb-bg-4JAW-CX0F-4V74',
    zone: 'UGSU',
    zone_plu: 'UGSU',
    plafond_hauteur_m: 31.0,
    hauteur_m: 6.2,
    dpe_classe: 'F',
    conso_kwh_m2_an: 360,
    ges_kgco2_m2_an: 74,
    annee_construction: 1958,
    emprise_m2: 540,
    niveaux: 2,
    niveaux_max: 9,
    usage: 'Stationnement / atelier automobile',
    usage_type: 'activite',
    sdp_existante_m2: 980,
    sdp_max_plu_m2: 4400,
    sdp_residuelle_m2: 3420,
    mutable: true,
    ptype: 'Mutation de parcelle',
    logts_potentiels: 54,
    murs: 'Béton banché et verrière',
    chauffage: 'Radiateurs électriques atelier',
    rules: [
      { k: 'Gabarit de hauteur', rule: 'Plafond 31,0 m', cur: '6,2 m', st: 'Surélévation possible' },
      { k: 'Emprise au sol max', rule: '65 % de la parcelle', cur: '85 %', st: 'Surélévation possible' },
      { k: 'Pleine terre / végétalisation', rule: '25 % min.', cur: '0 %', st: 'Non conforme' },
      { k: 'Servitude de mixité', rule: '30 % logements sociaux', cur: 'Néant', st: 'Non conforme' },
    ],
    variants: [
      {
        id: 'A',
        title: 'Faubourg Contemporain',
        style: 'Pierre calcaire locale et menuiseries bronze, gabarit R+8 aligné sur rue',
        sdp: 4120,
        emprise: 60,
        h: 31.0,
        niv: 9,
        logts: 58,
        aerialImg: '/assets/5241e7653adcb68d34e6c34ddbb06188.jpg',
        streetImg: '/assets/f65c01958af3cb639d720d0b3cbf4614.jpg',
        prompt: 'Immeuble d’angle parisien en pierre de taille massive, fenêtres hautes avec volets persiennés modernes, rez-de-chaussée commercial vivant, intégration harmonieuse.',
      },
      {
        id: 'B',
        title: 'Cour Intérieure Arborée',
        style: 'Bâtiment en U autour d’un jardin de pleine terre, passerelles suspendues',
        sdp: 3750,
        emprise: 52,
        h: 31.0,
        niv: 9,
        logts: 50,
        aerialImg: '/assets/770cc3d6b3d5ba1972f92e0ec5798b75.jpg',
        streetImg: '/assets/2a94b1fedd8660a1e82a29ee5cb964b4.jpg',
        prompt: 'Vue depuis la rue vers une cour plantée de grands arbres, façades légères en bois brûlé et verre, éclairage zénithal, architecture bioclimatique.',
      },
      {
        id: 'C',
        title: 'Surélévation Métallique',
        style: 'Conservation du socle atelier en brique, surélévation acier Corten et verre',
        sdp: 3420,
        emprise: 65,
        h: 31.0,
        niv: 9,
        logts: 48,
        aerialImg: '/assets/7af3a76cce91973ff8be7106de65fb95.jpg',
        streetImg: '/assets/e1b44a0c7603160bf0810115e1b13562.jpg',
        prompt: 'Réhabilitation avec surélévation audacieuse en métal cuivré et grandes loggias sur socle historique réhabilité en tiers-lieu artisanal.',
      },
    ],
  },

  // 3. Station Vincent-Auriol / Rue du Chevaleret
  '56103-0': {
    id: '56103-0',
    key: 'station',
    name: 'Station Vincent-Auriol',
    hero: true,
    adresse: 'Boulevard Vincent-Auriol',
    parcelle: '75113 000 AB 0192',
    bdnb_id: 'bdnb-bg-K37Q-29VF-0081',
    zone: 'UG',
    zone_plu: 'UG',
    plafond_hauteur_m: 28.0,
    hauteur_m: 4.5,
    dpe_classe: 'F',
    conso_kwh_m2_an: 310,
    ges_kgco2_m2_an: 62,
    annee_construction: 1972,
    emprise_m2: 460,
    niveaux: 1,
    niveaux_max: 8,
    usage: 'Station-service / auvent',
    usage_type: 'activite',
    sdp_existante_m2: 320,
    sdp_max_plu_m2: 3200,
    sdp_residuelle_m2: 2880,
    mutable: true,
    ptype: 'Mutation de parcelle',
    logts_potentiels: 44,
    murs: 'Auvent métallique et kiosque',
    chauffage: 'Climatisation réversible',
    rules: [
      { k: 'Gabarit de hauteur', rule: 'Plafond 28,0 m', cur: '4,5 m', st: 'Surélévation possible' },
      { k: 'Emprise au sol max', rule: '60 % de la parcelle', cur: '50 %', st: 'Conforme' },
      { k: 'Pleine terre / végétalisation', rule: '30 % min.', cur: '0 %', st: 'Non conforme' },
      { k: 'Dépollution préalable', rule: 'Diagnostic sols obligatoire', cur: 'Requis', st: 'Non conforme' },
    ],
    variants: [
      {
        id: 'A',
        title: 'Totem Urbain & Résidence Étudiante',
        style: 'Structure légère acier recyclé, modules préfabriqués, RDC ouvert sur boulevard',
        sdp: 3100,
        emprise: 54,
        h: 28.0,
        niv: 8,
        logts: 52,
        aerialImg: '/assets/09f0d8d278a9f55d2d05547ad9cfbce3.jpg',
        streetImg: '/assets/54f72e1ce20616fe10a64dbbfb473bc6.jpg',
        prompt: 'Immeuble élancé en bordure de boulevard parisien arboré avec piste cyclable, façade rythmée par des panneaux photovoltaïques verticaux colorés.',
      },
      {
        id: 'B',
        title: 'Hub Mixte Mobilités & Habitat',
        style: 'Station de recharge vélos/autopartage en RDC, 7 étages de logements bois',
        sdp: 2880,
        emprise: 50,
        h: 28.0,
        niv: 8,
        logts: 42,
        aerialImg: '/assets/230fc980dbfe6ffb6fa58cdcc95f08c9.jpg',
        streetImg: '/assets/8b2619550acf03ff0e5a2bc91c5339a4.jpg',
        prompt: 'Bâtiment d’angle moderne avec hub multimodal en rez-de-chaussée transparent, terrasses plantées à chaque étage, architecture chaleureuse en bois massif.',
      },
      {
        id: 'C',
        title: 'Jardin Perché & Co-living',
        style: 'Grandes terrasses collectives en toiture, double façade bio-climatique',
        sdp: 2650,
        emprise: 48,
        h: 28.0,
        niv: 8,
        logts: 38,
        aerialImg: '/assets/632898deb2c715f861982ef60b884414.jpg',
        streetImg: '/assets/a1bdb6bbcff9135b3d023b2341e799f3.jpg',
        prompt: 'Résidence moderne avec toiture-jardin suspendue luxuriante, façades dynamiques intégrant des jardins d’hiver privatifs, lumière de fin d’après-midi.',
      },
    ],
  },
};

export const DEMO_BUILDINGS = HERO_BUILDINGS;
export const DEMO_BUILDING_IDS = Object.keys(HERO_BUILDINGS);

// Deterministic hash to generate realistic fallback data for any other building
function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getBuildingAttributes(id: string, rawRow?: Record<string, any>): DemoAttributes {
  if (HERO_BUILDINGS[id]) {
    return HERO_BUILDINGS[id];
  }

  // If gold attributes exist in row, prioritize them
  const h = simpleHash(id);
  const dpeClasses: Array<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'> = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const dpe = (rawRow?.dpe_classe || dpeClasses[h % 7]) as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  const hauteur = Number(rawRow?.hauteur_m) || (10 + (h % 22) * 0.9);
  const plafond = Number(rawRow?.plafond_hauteur_m) || (hauteur > 24 ? 31.0 : hauteur > 18 ? 28.0 : 25.0);
  const emprise = Math.round(300 + (h % 550));
  const niveaux = Math.max(1, Math.round(hauteur / 3.1));
  const niveaux_max = Math.max(niveaux, Math.round(plafond / 3.1));
  const mutable = hauteur < 12 || (niveaux_max - niveaux >= 3 && (dpe === 'F' || dpe === 'G'));
  const sdpExist = Math.round(emprise * niveaux * 0.85);
  const sdpMax = Math.round(emprise * niveaux_max * 0.85);
  const resid = Math.max(0, sdpMax - sdpExist);

  const usages: Array<{ u: string; type: DemoAttributes['usage_type'] }> = [
    { u: 'Logement collectif', type: 'logement' },
    { u: 'Logement + commerce en RDC', type: 'commerce' },
    { u: 'Bureaux', type: 'bureaux' },
    { u: 'Activité / atelier', type: 'activite' },
    { u: 'Équipement public', type: 'equipement' },
  ];
  const usageChoice = usages[h % usages.length];

  const streetNames = ['Rue du Chevaleret', 'Rue de Tolbiac', 'Rue Clisson', 'Rue Jeanne d’Arc', 'Boulevard Vincent-Auriol', 'Rue Dunois', 'Rue Nationale'];
  const num = (h % 89) + 1;
  const adresse = rawRow?.adresse || `${num} ${streetNames[h % streetNames.length]}`;

  return {
    id,
    adresse,
    parcelle: `75113 000 ${String.fromCharCode(65 + (h % 4))}${String.fromCharCode(65 + (h % 4))} 0${(h % 800) + 100}`,
    bdnb_id: `bdnb-bg-${(h % 9000 + 1000).toString(36).toUpperCase()}-${(h % 8000 + 1000).toString(36).toUpperCase()}`,
    zone_plu: rawRow?.zone_plu || (h % 3 === 0 ? 'UGSU' : 'UG'),
    plafond_hauteur_m: Number(plafond.toFixed(1)),
    hauteur_m: Number(hauteur.toFixed(1)),
    dpe_classe: dpe,
    conso_kwh_m2_an: Math.round(110 + (dpe.charCodeAt(0) - 65) * 55 + (h % 30)),
    ges_kgco2_m2_an: Math.round(15 + (dpe.charCodeAt(0) - 65) * 12 + (h % 10)),
    annee_construction: 1890 + (h % 125),
    emprise_m2: emprise,
    niveaux,
    niveaux_max,
    usage: usageChoice.u,
    usage_type: usageChoice.type,
    sdp_existante_m2: sdpExist,
    sdp_max_plu_m2: sdpMax,
    sdp_residuelle_m2: resid,
    mutable,
    ptype: mutable ? 'Mutation de parcelle' : resid > 500 ? 'Surélévation' : 'Densification',
    logts_potentiels: Math.round(resid / 68),
    murs: h % 2 === 0 ? 'Pierre de taille et plâtre' : 'Béton armé',
    chauffage: h % 2 === 0 ? 'Gaz individuel' : 'Chauffage urbain CPCU',
    rules: [
      { k: 'Gabarit de hauteur', rule: `Plafond ${plafond} m`, cur: `${hauteur.toFixed(1)} m`, st: plafond > hauteur + 3 ? 'Surélévation possible' : 'Conforme' },
      { k: 'Emprise au sol max', rule: '65 % de la parcelle', cur: `${(50 + (h % 20))}%`, st: 'Conforme' },
      { k: 'Pleine terre min.', rule: '25 % min.', cur: `${(h % 15)}%`, st: (h % 15) >= 25 ? 'Conforme' : 'Non conforme' },
    ],
  };
}

export function computeSurelevationM2(attrs: DemoAttributes): number {
  return Math.round(attrs.emprise_m2 * Math.max(0, attrs.niveaux_max - attrs.niveaux) * 0.88);
}

export function isPassoireThermique(dpe: string): boolean {
  return dpe === 'F' || dpe === 'G';
}

// Generate realistic 3D building polygons for the Paris 13e demo perimeter
export function generateDemoPerimeterFeatures(): Array<{
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: any;
}> {
  const centerLon = 2.3715;
  const centerLat = 48.826;
  const features: any[] = [];

  // Add the 3 hero buildings at specific prominent locations
  const heroOffsets = [
    { id: '55147-0', dx: 0.0008, dy: 0.0006, w: 0.00045, h: 0.0003 }, // Entrepôt Chevaleret
    { id: '56088-0', dx: -0.0012, dy: -0.0005, w: 0.00035, h: 0.00035 }, // Garage Tolbiac
    { id: '56103-0', dx: 0.0002, dy: -0.0012, w: 0.0004, h: 0.00025 }, // Station Vincent-Auriol
  ];

  for (const ho of heroOffsets) {
    const lon = centerLon + ho.dx;
    const lat = centerLat + ho.dy;
    const poly = [
      [lon - ho.w, lat - ho.h],
      [lon + ho.w, lat - ho.h],
      [lon + ho.w, lat + ho.h],
      [lon - ho.w, lat + ho.h],
      [lon - ho.w, lat - ho.h],
    ];
    const attrs = HERO_BUILDINGS[ho.id];
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [poly],
      },
      properties: {
        batiment_groupe_id: ho.id,
        commune_insee: '75113',
        centroid_lon: lon,
        centroid_lat: lat,
        adresse: attrs.adresse,
        hauteur_m: attrs.hauteur_m,
        dpe_classe: attrs.dpe_classe,
        conso_kwh_m2_an: attrs.conso_kwh_m2_an,
        sdp_existante_m2: attrs.sdp_existante_m2,
        zone_plu: attrs.zone_plu,
        plafond_hauteur_m: attrs.plafond_hauteur_m,
        sdp_residuelle_m2: attrs.sdp_residuelle_m2,
      },
    });
  }

  // Generate a realistic grid of surrounding city blocks
  const rows = 8;
  const cols = 9;
  let counter = 100;

  for (let r = -rows / 2; r < rows / 2; r++) {
    for (let c = -cols / 2; c < cols / 2; c++) {
      if (Math.abs(r) <= 1 && Math.abs(c) <= 1 && (r !== 0 || c !== 0)) {
        // Leave room for heroes
      }
      const bId = `b${counter++}`;
      const lon = centerLon + c * 0.00095 + (Math.sin(r * 2) * 0.00015);
      const lat = centerLat + r * 0.0007 + (Math.cos(c * 2) * 0.00012);
      const bw = 0.00032 + ((counter % 5) * 0.00003);
      const bh = 0.00024 + ((counter % 4) * 0.000025);

      const poly = [
        [lon - bw, lat - bh],
        [lon + bw, lat - bh],
        [lon + bw, lat + bh],
        [lon - bw, lat + bh],
        [lon - bw, lat - bh],
      ];

      const attrs = getBuildingAttributes(bId);
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [poly],
        },
        properties: {
          batiment_groupe_id: bId,
          commune_insee: '75113',
          centroid_lon: lon,
          centroid_lat: lat,
          adresse: attrs.adresse,
          hauteur_m: attrs.hauteur_m,
          dpe_classe: attrs.dpe_classe,
          conso_kwh_m2_an: attrs.conso_kwh_m2_an,
          sdp_existante_m2: attrs.sdp_existante_m2,
          zone_plu: attrs.zone_plu,
          plafond_hauteur_m: attrs.plafond_hauteur_m,
          sdp_residuelle_m2: attrs.sdp_residuelle_m2,
        },
      });
    }
  }

  return features;
}

