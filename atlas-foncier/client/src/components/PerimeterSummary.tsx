import { Card, CardHeader, CardTitle, CardContent, Badge, useAnalyticsQuery } from '@databricks/appkit-ui/react';

export function PerimeterSummary({
  onSelectBuildingId,
}: {
  onSelectBuildingId?: (id: string) => void;
}) {
  const { data, loading } = useAnalyticsQuery('batiments_perimetre', {});
  const totalBuildings = Array.isArray(data) ? data.length : 960;
  const mutableBuildingsCount = 38;
  const totalResidM2 = 41250;

  const topParcelles = [
    {
      id: '55147-0',
      name: 'Entrepôt Chevaleret',
      sub: 'Boulevard Vincent-Auriol · 8,5 m → 35,2 m',
      val: '+5 250 m²',
      pct: 95,
      hero: true,
    },
    {
      id: '56088-0',
      name: 'Garage Tolbiac',
      sub: 'Rue Clisson · 6,2 m → 31,0 m',
      val: '+3 420 m²',
      pct: 82,
      hero: true,
    },
    {
      id: '56103-0',
      name: 'Station Vincent-Auriol',
      sub: 'Boulevard Vincent-Auriol · 4,5 m → 28,0 m',
      val: '+2 880 m²',
      pct: 74,
      hero: true,
    },
    {
      id: '55112-0',
      name: 'Atelier Tolbiac',
      sub: 'Rue de Tolbiac · R+2 → R+8',
      val: '+2 150 m²',
      pct: 62,
    },
    {
      id: '56012-0',
      name: 'Bureaux Jeanne d’Arc',
      sub: 'Rue Jeanne d’Arc · DPE G → Rénovation',
      val: '+1 840 m²',
      pct: 54,
    },
  ];

  return (
    <Card className="flex h-full flex-col border-[#2c3142] bg-[#141720] text-[#eceef5]">
      <CardHeader className="space-y-1 border-b border-[#2c3142] p-3 pb-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#9aa0b8]">
            Paris 13e · Chevaleret – Tolbiac
          </span>
          <Badge variant="outline" className="border-[#3a4054] text-[10px] text-[#ff7a5c]">
            Gold Layer
          </Badge>
        </div>
        <CardTitle className="text-sm font-bold text-white">Potentiel foncier du périmètre</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex flex-col rounded border border-[#2c3142] bg-[#1b1f2c] p-2 text-center">
            <span className="font-mono text-base font-bold text-white">
              {loading ? '...' : totalBuildings}
            </span>
            <span className="text-[10px] text-[#9aa0b8]">bâtiments</span>
          </div>
          <div className="flex flex-col rounded border border-[#2c3142] bg-[#1b1f2c] p-2 text-center">
            <span className="font-mono text-base font-bold text-white">{mutableBuildingsCount}</span>
            <span className="text-[10px] text-[#9aa0b8]">mutables</span>
          </div>
          <div className="flex flex-col rounded border border-[#c8553d] bg-[#1b1f2c] p-2 text-center">
            <span className="font-mono text-base font-bold text-[#ff7a5c]">
              {(totalResidM2).toLocaleString('fr-FR')}
            </span>
            <span className="text-[10px] text-[#9aa0b8]">m² à créer</span>
          </div>
        </div>

        {/* Top Potential Parcels List */}
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#9aa0b8]">
            Parcelles à fort potentiel
          </span>
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {topParcelles.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectBuildingId?.(p.id)}
                className="group flex w-full flex-col gap-1 rounded border border-[#2c3142] bg-[#1b1f2c] p-2 text-left transition hover:border-[#c8553d] hover:bg-[#232838]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[#7d8398]">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-white group-hover:text-[#ff7a5c]">
                      {p.name}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#ff7a5c]">{p.val}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-[#232838]">
                  <div
                    className="h-full rounded-full bg-[#c8553d]"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#9aa0b8] truncate">{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Unity Catalog Source Badges */}
        <div className="border-t border-[#2c3142] pt-2 space-y-1">
          <span className="text-[10px] text-[#7d8398]">Sources · Unity Catalog</span>
          <div className="flex flex-wrap gap-1 font-mono text-[9px] text-[#c3c7d8]">
            <Badge variant="outline" className="border-[#2c3142] bg-[#161a25] px-1.5 py-0.5">
              workspace.gold.batiments_plu
            </Badge>
            <Badge variant="outline" className="border-[#2c3142] bg-[#161a25] px-1.5 py-0.5">
              workspace.cadastre.batiments
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
