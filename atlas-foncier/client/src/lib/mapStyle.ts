import { getBuildingAttributes } from './demoAttributes';

export type MapLayerKey = 'usage' | 'dpe' | 'potentiel';

export interface BuildingRow {
  batiment_groupe_id: string;
  commune_insee?: string;
  centroid_lon?: number;
  centroid_lat?: number;
  geometry_geojson?: string;
  adresse?: string;
  hauteur_m?: number;
  dpe_classe?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  conso_kwh_m2_an?: number;
  sdp_existante_m2?: number;
  zone_plu?: string;
  plafond_hauteur_m?: number;
  sdp_residuelle_m2?: number;
}

// Deck.gl RGBA color format: [r, g, b, a] (0-255)
export type ColorRGBA = [number, number, number, number];

export const COLOR_PALETTE = {
  // Usages
  commerce: [143, 134, 214, 240] as ColorRGBA,   // #8f86d6
  logement: [127, 184, 159, 240] as ColorRGBA,   // #7fb89f
  bureaux: [134, 169, 218, 240] as ColorRGBA,    // #86a9da
  activite: [185, 184, 198, 240] as ColorRGBA,   // #b9b8c6
  equipement: [220, 191, 133, 240] as ColorRGBA, // #dcbf85
  neutral: [90, 96, 120, 200] as ColorRGBA,

  // DPE
  dpeA: [47, 143, 91, 240] as ColorRGBA,
  dpeB: [91, 171, 79, 240] as ColorRGBA,
  dpeC: [163, 201, 63, 240] as ColorRGBA,
  dpeD: [224, 201, 63, 240] as ColorRGBA,
  dpeE: [224, 151, 63, 240] as ColorRGBA,
  dpeF: [217, 97, 63, 255] as ColorRGBA,
  dpeG: [178, 63, 40, 255] as ColorRGBA,

  // Potentiel
  mutable: [200, 85, 61, 255] as ColorRGBA,       // #c8553d Terracotta
  potHigh: [231, 164, 140, 240] as ColorRGBA,     // #e7a48c
  potLow: [140, 145, 170, 200] as ColorRGBA,      // #8c91aa
  stable: [50, 56, 75, 190] as ColorRGBA,

  // Highlights
  selectedOutline: [255, 122, 92, 255] as ColorRGBA,
  hoverHighlight: [255, 220, 130, 255] as ColorRGBA,
  pluEnvelope: [200, 85, 61, 60] as ColorRGBA,
  pluWireframe: [255, 122, 92, 200] as ColorRGBA,
};

export function getBuildingColorRGBA(
  row: BuildingRow,
  layer: MapLayerKey,
  isSelected: boolean = false,
  isHighlighted: boolean = false
): ColorRGBA {
  if (isSelected) {
    return [255, 122, 92, 255];
  }
  if (isHighlighted) {
    return [255, 200, 100, 255];
  }

  const attrs = getBuildingAttributes(row.batiment_groupe_id, row);

  if (layer === 'usage') {
    switch (attrs.usage_type) {
      case 'commerce':
        return COLOR_PALETTE.commerce;
      case 'logement':
        return COLOR_PALETTE.logement;
      case 'bureaux':
        return COLOR_PALETTE.bureaux;
      case 'activite':
        return COLOR_PALETTE.activite;
      case 'equipement':
        return COLOR_PALETTE.equipement;
      default:
        return COLOR_PALETTE.neutral;
    }
  }

  if (layer === 'dpe') {
    switch (attrs.dpe_classe) {
      case 'A':
        return COLOR_PALETTE.dpeA;
      case 'B':
        return COLOR_PALETTE.dpeB;
      case 'C':
        return COLOR_PALETTE.dpeC;
      case 'D':
        return COLOR_PALETTE.dpeD;
      case 'E':
        return COLOR_PALETTE.dpeE;
      case 'F':
        return COLOR_PALETTE.dpeF;
      case 'G':
        return COLOR_PALETTE.dpeG;
      default:
        return COLOR_PALETTE.neutral;
    }
  }

  // Layer 'potentiel'
  if (attrs.mutable) {
    return COLOR_PALETTE.mutable;
  }
  const headroom = attrs.plafond_hauteur_m - attrs.hauteur_m;
  if (headroom >= 6 || attrs.sdp_residuelle_m2 > 1000) {
    return COLOR_PALETTE.potHigh;
  }
  if (headroom > 1 || attrs.sdp_residuelle_m2 > 200) {
    return COLOR_PALETTE.potLow;
  }
  return COLOR_PALETTE.stable;
}

export function getBuildingHeight(row: BuildingRow, target: 'current' | 'plu' = 'current'): number {
  const attrs = getBuildingAttributes(row.batiment_groupe_id, row);
  if (target === 'plu') {
    return attrs.plafond_hauteur_m || 25;
  }
  return attrs.hauteur_m || 15;
}

export function mapLayerLegend(layer: MapLayerKey) {
  switch (layer) {
    case 'usage':
      return [
        { color: '#8f86d6', label: 'Commerce (RDC)' },
        { color: '#7fb89f', label: 'Logement' },
        { color: '#86a9da', label: 'Bureaux' },
        { color: '#b9b8c6', label: 'Activité / atelier' },
        { color: '#dcbf85', label: 'Équipement public' },
      ];
    case 'dpe':
      return [
        { color: '#2f8f5b', label: 'DPE A / B (Performant)' },
        { color: '#a3c93f', label: 'DPE C' },
        { color: '#e0c93f', label: 'DPE D' },
        { color: '#e0973f', label: 'DPE E' },
        { color: '#d9613f', label: 'DPE F (Passoire)' },
        { color: '#b23f28', label: 'DPE G (Très énergivore)' },
      ];
    case 'potentiel':
      return [
        { color: '#c8553d', label: 'Parcelle mutable (Mutation prioritaire)' },
        { color: '#e7a48c', label: 'Fort potentiel (+6 m / > 1 000 m²)' },
        { color: '#8c91aa', label: 'Potentiel modéré' },
        { color: '#32384b', label: 'Bâti consolidé (Gabarit max atteint)' },
      ];
  }
}

