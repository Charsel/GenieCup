import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@databricks/appkit-ui/react';
import { Building2 } from 'lucide-react';
import type { BuildingRow } from './MapView';

function isPassoireThermique(dpe: string | null): boolean {
  return dpe === 'F' || dpe === 'G';
}

export function ParcelSheet({
  row,
  onOpenChange,
}: {
  row: BuildingRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const matched = !!row?.adresse;

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-lg">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle>{row.adresse ?? `Bâtiment ${row.batiment_groupe_id}`}</SheetTitle>
              <SheetDescription>
                Parcelle cadastrale {row.batiment_groupe_id} · {row.commune_insee}
              </SheetDescription>
              <Badge variant={matched ? 'secondary' : 'outline'} className="w-fit">
                {matched ? 'BDNB' : 'Pas de correspondance BDNB'}
              </Badge>
            </SheetHeader>

            {!matched ? (
              <Empty className="mt-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>Pas de correspondance BDNB pour ce bâtiment</EmptyTitle>
                  <EmptyDescription>
                    Ce bâtiment vient du cadastre réel (Chantier 1). Le rapprochement spatial
                    avec la BDNB (Chantier 1) n&rsquo;a trouvé aucune correspondance à moins de
                    ~25 m — environ 12% des bâtiments du périmètre sont dans ce cas (annexes,
                    cours, décalage de digitalisation entre les deux sources).
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Tabs defaultValue="bdnb" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="bdnb">BDNB</TabsTrigger>
                  <TabsTrigger value="plu">PLU</TabsTrigger>
                  <TabsTrigger value="cap">Capacité</TabsTrigger>
                  <TabsTrigger value="gen">Génération IA</TabsTrigger>
                </TabsList>

                <TabsContent value="bdnb" className="space-y-3 pt-4 text-sm">
                  <Fact label="Adresse" value={row.adresse ?? '—'} />
                  <Fact label="Type de bâtiment" value={row.type_batiment ?? '—'} />
                  <Fact label="Année de construction" value={row.annee_construction ?? '—'} />
                  <Fact label="Hauteur" value={row.hauteur_m != null ? `${row.hauteur_m} m` : '—'} />
                  <Fact
                    label="DPE"
                    value={row.dpe_classe ?? 'Non renseigné'}
                    badge={row.dpe_classe ? (isPassoireThermique(row.dpe_classe) ? 'destructive' : 'secondary') : undefined}
                  />
                  <Fact label="Classe GES" value={row.ges_classe ?? 'Non renseigné'} />
                  <Fact label="Logements" value={row.nombre_logements ?? 0} />
                  <Fact
                    label="Emprise au sol"
                    value={row.emprise_au_sol_m2 != null ? `${row.emprise_au_sol_m2.toLocaleString('fr-FR')} m²` : '—'}
                  />
                </TabsContent>

                <TabsContent value="plu" className="pt-4 text-sm">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Building2 className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>Zonage PLU pas encore branché</EmptyTitle>
                      <EmptyDescription>
                        Le règlement de zone (secteur de hauteur, plafond, emprise autorisée)
                        arrivera avec l&rsquo;index Vector Search sur les documents PLU
                        (Chantier 2).
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TabsContent>

                <TabsContent value="cap" className="space-y-3 pt-4 text-sm">
                  <Fact label="Hauteur actuelle" value={row.hauteur_m != null ? `${row.hauteur_m} m` : '—'} />
                  <Fact
                    label="Emprise au sol"
                    value={row.emprise_au_sol_m2 != null ? `${row.emprise_au_sol_m2.toLocaleString('fr-FR')} m²` : '—'}
                  />
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Building2 className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>Capacité constructible pas encore calculable</EmptyTitle>
                      <EmptyDescription>
                        Le calcul (surélévation, démolition-reconstruction) a besoin du plafond
                        de hauteur PLU, pas encore branché (Chantier 2).
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TabsContent>

                <TabsContent value="gen" className="pt-4 text-sm">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Building2 className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>Rendu génératif pas encore branché</EmptyTitle>
                      <EmptyDescription>
                        L&rsquo;endpoint Model Serving (Chantier 4) générera ici un rendu du
                        volume constructible à partir d&rsquo;un prompt dérivé de la BDNB et du
                        PLU.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Fact({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | number;
  badge?: 'destructive' | 'default' | 'secondary' | 'outline';
}) {
  return (
    <div className="flex items-center justify-between border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      {badge ? <Badge variant={badge}>{value}</Badge> : <span className="font-medium">{value}</span>}
    </div>
  );
}
