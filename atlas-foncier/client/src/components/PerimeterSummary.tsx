import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton, useAnalyticsQuery } from '@databricks/appkit-ui/react';

export function PerimeterSummary() {
  const { data, loading, error } = useAnalyticsQuery('batiments_perimetre', {});

  const total = data?.length ?? 0;
  const matched = data?.filter((r) => !!r.adresse).length ?? 0;
  const passoires = data?.filter((r) => r.dpe_classe === 'F' || r.dpe_classe === 'G').length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Potentiel foncier du périmètre</CardTitle>
        <p className="text-xs text-muted-foreground">Paris 13e · îlots Chevaleret – Tolbiac</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <Skeleton className="h-16 w-full" />}
        {error && <p className="text-sm text-destructive">Erreur : {error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat value={total} label="bâtiments" />
            <Stat value={matched} label="avec BDNB" note={`${total ? Math.round((100 * matched) / total) : 0}%`} />
            <Stat value={passoires} label="passoires (F/G)" />
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Sources · Unity Catalog
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="font-mono text-[11px]">
              workspace.cadastre.batiments
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px]">
              workspace.bdnb.batiments
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px]">
              workspace.gold.batiments_plu
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Adresse/hauteur/DPE réels via rapprochement spatial cadastre ↔ BDNB. Zonage PLU
          (plafond de hauteur, m² à créer) en attente du Chantier 2.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted p-2">
      <span className="font-mono text-lg font-semibold">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {note && <span className="text-[10px] text-muted-foreground/70">{note}</span>}
    </div>
  );
}
