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
import { DEMO_BUILDINGS, computeSurelevationM2, isPassoireThermique } from '../lib/demoAttributes';

export function ParcelSheet({
  row,
  onOpenChange,
}: {
  row: BuildingRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const demo = row ? DEMO_BUILDINGS[row.batiment_groupe_id] : undefined;

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle>{demo?.adresse ?? `Bâtiment ${row.batiment_groupe_id}`}</SheetTitle>
              <SheetDescription>
                Parcelle cadastrale {row.batiment_groupe_id} · {row.commune_insee}
              </SheetDescription>
              {!demo && (
                <Badge variant="outline" className="w-fit">
                  Fiche non disponible — BDNB pas encore branché
                </Badge>
              )}
              {demo && (
                <Badge variant="secondary" className="w-fit">
                  Exemple illustratif — données de démonstration
                </Badge>
              )}
            </SheetHeader>

            {!demo ? (
              <Empty className="mt-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>Pas encore de données pour ce bâtiment</EmptyTitle>
                  <EmptyDescription>
                    Ce bâtiment vient du cadastre réel (Chantier 1), mais ses attributs BDNB/PLU
                    (hauteur, DPE, capacité) ne sont pas encore branchés. Trois parcelles
                    d&rsquo;exemple sur la carte montrent le rendu final attendu.
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
                  <Fact label="Adresse" value={demo.adresse} />
                  <Fact label="Usage" value={demo.usage} />
                  <Fact label="Hauteur actuelle" value={`${demo.hauteur_m} m`} />
                  <Fact
                    label="DPE"
                    value={demo.dpe_classe}
                    badge={isPassoireThermique(demo.dpe_classe) ? 'destructive' : undefined}
                  />
                  <Fact label="Consommation" value={`${demo.conso_kwh_m2_an} kWh/m²/an`} />
                  <Fact label="Surface de plancher existante" value={`${demo.sdp_existante_m2.toLocaleString('fr-FR')} m²`} />
                </TabsContent>

                <TabsContent value="plu" className="space-y-3 pt-4 text-sm">
                  <Fact label="Zone PLU" value={demo.zone_plu} />
                  <Fact label="Plafond de hauteur" value={`${demo.plafond_hauteur_m} m`} />
                  <Fact
                    label="Marge de hauteur"
                    value={`${(demo.plafond_hauteur_m - demo.hauteur_m).toFixed(1)} m`}
                  />
                  <p className="text-muted-foreground">
                    Règlement de zone complet : à brancher sur l&rsquo;index Vector Search PLU
                    (Chantier 2) une fois les documents indexés.
                  </p>
                </TabsContent>

                <TabsContent value="cap" className="space-y-3 pt-4 text-sm">
                  <Fact label="Emprise au sol" value={`${demo.emprise_m2.toLocaleString('fr-FR')} m²`} />
                  <Fact label="Niveaux actuels / max" value={`${demo.niveaux} / ${demo.niveaux_max}`} />
                  <div className="rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
                    Emprise {demo.emprise_m2} m² × ({demo.niveaux_max} − {demo.niveaux}) niveaux × 0,88
                    <br />= {computeSurelevationM2(demo).toLocaleString('fr-FR')} m² en surélévation
                  </div>
                </TabsContent>

                <TabsContent value="gen" className="space-y-3 pt-4 text-sm">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Building2 className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>Rendu génératif pas encore branché</EmptyTitle>
                      <EmptyDescription>
                        L&rsquo;endpoint Model Serving (Chantier 4) générera ici un rendu du volume
                        constructible à partir d&rsquo;un prompt dérivé de la BDNB et du PLU.
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
