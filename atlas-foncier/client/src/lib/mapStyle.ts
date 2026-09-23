import type { QueryRegistry } from '@databricks/appkit-ui/react';

export type MapLayerKey = 'usage' | 'dpe' | 'potentiel';

export type BuildingRow = QueryRegistry['batiments_perimetre']['result'][number];

const NEUTRAL_FILL = '#c7c9d9';
const NEUTRAL_STROKE = '#8b8ea3';

const USAGE_COLORS: Record<string, string> = {
  'Résidentiel collectif': '#4462c9',
  'Résidentiel individuel': '#6a8fe0',
  'Tertiaire & Autres': '#8a5fc9',
  'Indifférencié': '#c98a3f',
};

const DPE_COLORS: Record<string, string> = {
  A: '#2f8f5b',
  B: '#5bab4f',
  C: '#a3c93f',
  D: '#e0c93f',
  E: '#e0973f',
  F: '#d9613f',
  G: '#b23f28',
};

export function fillFor(row: BuildingRow, layer: MapLayerKey): { fill: string; stroke: string } {
  if (layer === 'usage') {
    if (!row.type_batiment) return { fill: NEUTRAL_FILL, stroke: NEUTRAL_STROKE };
    return { fill: USAGE_COLORS[row.type_batiment] ?? NEUTRAL_FILL, stroke: '#1f1e29' };
  }
  if (layer === 'dpe') {
    if (!row.dpe_classe) return { fill: NEUTRAL_FILL, stroke: NEUTRAL_STROKE };
    return { fill: DPE_COLORS[row.dpe_classe] ?? NEUTRAL_FILL, stroke: '#1f1e29' };
  }
  // potentiel : nécessite le plafond de hauteur PLU (Chantier 2), pas encore disponible
  return { fill: NEUTRAL_FILL, stroke: NEUTRAL_STROKE };
}

const LEGENDS: Record<MapLayerKey, Array<{ color: string; label: string }>> = {
  usage: [
    { color: USAGE_COLORS['Résidentiel collectif'], label: 'Résidentiel collectif' },
    { color: USAGE_COLORS['Résidentiel individuel'], label: 'Résidentiel individuel' },
    { color: USAGE_COLORS['Tertiaire & Autres'], label: 'Tertiaire & Autres' },
    { color: NEUTRAL_FILL, label: 'Pas de correspondance BDNB' },
  ],
  dpe: [
    { color: DPE_COLORS.C, label: 'DPE C' },
    { color: DPE_COLORS.E, label: 'DPE E' },
    { color: DPE_COLORS.G, label: 'DPE G (passoire)' },
    { color: NEUTRAL_FILL, label: 'DPE inconnu ou pas de correspondance BDNB' },
  ],
  potentiel: [{ color: NEUTRAL_FILL, label: 'Nécessite le PLU (Chantier 2), pas encore disponible' }],
};

export function mapLayerLegend(layer: MapLayerKey) {
  return LEGENDS[layer];
}
