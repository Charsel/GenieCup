import { describe, it, expect } from 'vitest';
import { getBuildingAttributes, computeSurelevationM2, isPassoireThermique } from '../lib/demoAttributes';
import { getBuildingColorRGBA, getBuildingHeight } from '../lib/mapStyle';

describe('Atlas Foncier 3D Logic', () => {
  it('correctly resolves hero building attributes', () => {
    const entrepot = getBuildingAttributes('55147-0');
    expect(entrepot.hero).toBe(true);
    expect(entrepot.plafond_hauteur_m).toBe(35.2);
    expect(entrepot.dpe_classe).toBe('G');
    expect(isPassoireThermique(entrepot.dpe_classe)).toBe(true);
    expect(entrepot.variants?.length).toBe(3);
  });

  it('computes surélévation capacity accurately', () => {
    const demo = {
      emprise_m2: 500,
      niveaux: 4,
      niveaux_max: 8,
    } as any;
    const res = computeSurelevationM2(demo);
    expect(res).toBe(Math.round(500 * (8 - 4) * 0.88));
  });

  it('determines 3D building color for deck.gl', () => {
    const row = { batiment_groupe_id: '55147-0' } as any;
    const colorUsage = getBuildingColorRGBA(row, 'usage');
    expect(colorUsage).toBeDefined();
    expect(colorUsage.length).toBe(4);

    const height = getBuildingHeight(row, 'current');
    expect(height).toBeGreaterThan(0);
  });
});
