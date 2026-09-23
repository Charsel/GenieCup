import type { QueryRegistry } from '@databricks/appkit-ui/react';
import { DEMO_BUILDINGS } from './demoAttributes';

export type MapLayerKey = 'usage' | 'dpe' | 'potentiel';

export type BuildingRow = QueryRegistry['batiments_perimetre']['result'][number];

const NEUTRAL_FILL = '#c7c9d9';
const NEUTRAL_STROKE = '#8b8ea3';

const USAGE_COLORS: Record<string, string> = {
  'Logement + commerce en RDC': '#4462c9',
  Bureaux: '#8a5fc9',
  'Activité / entrepôt': '#c98a3f',
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
  const demo = DEMO_BUILDINGS[row.batiment_groupe_id];
  if (!demo) return { fill: NEUTRAL_FILL, stroke: NEUTRAL_STROKE };

  if (layer === 'usage') {
    return { fill: USAGE_COLORS[demo.usage] ?? NEUTRAL_FILL, stroke: '#1f1e29' };
  }
  if (layer === 'dpe') {
    return { fill: DPE_COLORS[demo.dpe_classe] ?? NEUTRAL_FILL, stroke: '#1f1e29' };
  }
  const headroom = demo.plafond_hauteur_m - demo.hauteur_m;
  const fill = headroom >= 8 ? '#c8553d' : headroom >= 4 ? '#e7a48c' : '#f2d5c9';
  return { fill, stroke: '#1f1e29' };
}

const LEGENDS: Record<MapLayerKey, Array<{ color: string; label: string }>> = {
  usage: [
    { color: USAGE_COLORS['Logement + commerce en RDC'], label: 'Logement + commerce' },
    { color: USAGE_COLORS.Bureaux, label: 'Bureaux' },
    { color: USAGE_COLORS['Activité / entrepôt'], label: 'Activité / entrepôt' },
    { color: NEUTRAL_FILL, label: 'Donnée non disponible (BDNB à venir)' },
  ],
  dpe: [
    { color: DPE_COLORS.D, label: 'DPE D' },
    { color: DPE_COLORS.F, label: 'DPE F' },
    { color: DPE_COLORS.G, label: 'DPE G (passoire)' },
    { color: NEUTRAL_FILL, label: 'Donnée non disponible (BDNB à venir)' },
  ],
  potentiel: [
    { color: '#c8553d', label: 'Fort potentiel (surélévation > 8 m)' },
    { color: '#e7a48c', label: 'Potentiel moyen' },
    { color: '#f2d5c9', label: 'Potentiel faible' },
    { color: NEUTRAL_FILL, label: 'Donnée non disponible (BDNB/PLU à venir)' },
  ],
};

export function mapLayerLegend(layer: MapLayerKey) {
  return LEGENDS[layer];
}
