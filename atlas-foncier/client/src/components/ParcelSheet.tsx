import { useState } from 'react';
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
} from '@databricks/appkit-ui/react';
import { Building2, Sparkles, CheckCircle2, AlertTriangle, Eye, Leaf } from 'lucide-react';
import type { BuildingRow } from './DeckMap3D';
import { getBuildingAttributes, isPassoireThermique } from '../lib/demoAttributes';

const DPE_COLORS: Record<string, string> = {
  A: '#2f8f5b',
  B: '#5bab4f',
  C: '#a3c93f',
  D: '#e0c93f',
  E: '#e0973f',
  F: '#d9613f',
  G: '#b23f28',
};

const GEN_STEPS = [
  'Lecture du gabarit PLU et de la volumétrie 3D...',
  'Placement de la caméra au niveau de la rue (1,65 m)...',
  'Génération photoréaliste des façades et du contexte...',
  'Finalisation du rendu via Model Serving...',
];

export function ParcelSheet({
  row,
  onOpenChange,
}: {
  row: BuildingRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<'bdnb' | 'plu' | 'cap' | 'gen'>('bdnb');
  const [selectedVariantId, setSelectedVariantId] = useState<'A' | 'B' | 'C'>('A');
  const [viewMode, setViewMode] = useState<'aerial' | 'street'>('aerial');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStepIndex, setGenStepIndex] = useState(0);
  const [genProgress, setGenProgress] = useState(0);

  if (!row) return null;

  const attrs = getBuildingAttributes(row.batiment_groupe_id, row);
  const variants = attrs.variants;
  const activeVariant = variants?.find((v) => v.id === selectedVariantId) || variants?.[0];

  const handleGenerateStreet = () => {
    setIsGenerating(true);
    setGenProgress(10);
    setGenStepIndex(0);

    const stepInterval = setInterval(() => {
      setGenProgress((p) => {
        if (p >= 90) {
          clearInterval(stepInterval);
          setTimeout(() => {
            setIsGenerating(false);
            setViewMode('street');
          }, 600);
          return 100;
        }
        const next = p + 25;
        if (next > 75) setGenStepIndex(3);
        else if (next > 50) setGenStepIndex(2);
        else if (next > 25) setGenStepIndex(1);
        return next;
      });
    }, 500);
  };

  const dpeClasses: Array<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'> = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-[#2c3142] bg-[#141720] text-[#eceef5] sm:max-w-xl">
        <SheetHeader className="space-y-2 border-b border-[#2c3142] pb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-[#ff7a5c]">
              {attrs.hero ? '⭐ Parcelle phare du territoire' : 'Fiche Bâtiment'}
            </span>
            <Badge variant="outline" className="border-[#3a4054] text-[11px] text-[#9aa0b8]">
              Parcelle {attrs.parcelle}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold text-white">
            {attrs.name ? `${attrs.name} · ${attrs.adresse}` : attrs.adresse}
          </SheetTitle>
          <SheetDescription className="text-xs text-[#9aa0b8]">
            Paris 13e · BDNB {attrs.bdnb_id} · Zone PLU <span className="font-bold text-[#eceef5]">{attrs.zone_plu}</span>
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'bdnb' | 'plu' | 'cap' | 'gen')}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-4 bg-[#1b1f2c] p-1">
            <TabsTrigger value="bdnb" className="text-xs data-[state=active]:bg-[#c8553d] data-[state=active]:text-white">
              BDNB
            </TabsTrigger>
            <TabsTrigger value="plu" className="text-xs data-[state=active]:bg-[#c8553d] data-[state=active]:text-white">
              PLU
            </TabsTrigger>
            <TabsTrigger value="cap" className="text-xs data-[state=active]:bg-[#c8553d] data-[state=active]:text-white">
              Capacité
            </TabsTrigger>
            <TabsTrigger value="gen" className="text-xs data-[state=active]:bg-[#c8553d] data-[state=active]:text-white">
              <Sparkles className="mr-1 h-3 w-3" />
              Génération IA
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BDNB */}
          <TabsContent value="bdnb" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <FactCard label="Usage principal" value={attrs.usage} />
              <FactCard label="Année de construction" value={attrs.annee_construction || 1965} />
              <FactCard label="Hauteur actuelle" value={`${attrs.hauteur_m} m`} />
              <FactCard label="Nombre de niveaux" value={`${attrs.niveaux} étages`} />
              <FactCard label="Emprise au sol" value={`${attrs.emprise_m2.toLocaleString('fr-FR')} m²`} />
              <FactCard label="SDP existante" value={`${attrs.sdp_existante_m2.toLocaleString('fr-FR')} m²`} />
              <FactCard label="Murs & enveloppe" value={attrs.murs} />
              <FactCard label="Type de chauffage" value={attrs.chauffage} />
            </div>

            {/* DPE Scale */}
            <div className="rounded-md border border-[#2c3142] bg-[#1b1f2c] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#eceef5]">Diagnostic de performance énergétique (DPE)</span>
                <span className="font-mono text-xs text-[#9aa0b8]">
                  {attrs.conso_kwh_m2_an} kWh/m²/an · {attrs.ges_kgco2_m2_an} kgCO₂/m²
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 pt-1">
                {dpeClasses.map((cls) => {
                  const isActive = attrs.dpe_classe === cls;
                  return (
                    <div
                      key={cls}
                      className={`flex h-8 items-center justify-center rounded text-xs font-bold text-white transition-all ${
                        isActive ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-40'
                      }`}
                      style={{ backgroundColor: DPE_COLORS[cls] }}
                    >
                      {cls}
                    </div>
                  );
                })}
              </div>
              {isPassoireThermique(attrs.dpe_classe) && (
                <div className="mt-2 flex items-center gap-2 rounded bg-[#c8553d]/20 px-2 py-1 text-[11px] text-[#ff7a5c]">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Passoire thermique (DPE {attrs.dpe_classe}) : rénovation globale ou mutation recommandée</span>
                </div>
              )}
              {isPassoireThermique(attrs.dpe_classe) && (
                <p className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-snug text-[#7fb89f]">
                  <Leaf className="mt-px h-3 w-3 flex-shrink-0" />
                  <span>
                    Loi Climat &amp; Résilience : logements classés G interdits à la location depuis 2025, F en 2028,
                    E en 2034. Coupler la surélévation à la rénovation finance la sortie du statut de passoire.
                  </span>
                </p>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: PLU */}
          <TabsContent value="plu" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <FactCard label="Zone PLU bioclimatique" value={attrs.zone_plu} highlight />
              <FactCard label="Plafond de hauteur réglementaire" value={`${attrs.plafond_hauteur_m} m`} highlight />
            </div>

            <div className="rounded-md border border-[#2c3142] bg-[#1b1f2c] overflow-hidden">
              <div className="border-b border-[#2c3142] bg-[#232838] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#9aa0b8]">
                Règles d&rsquo;urbanisme & Conformité
              </div>
              <div className="divide-y divide-[#2c3142]">
                {attrs.rules.map((r) => (
                  <div key={r.k} className="flex items-center justify-between p-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-medium text-[#eceef5]">{r.k}</div>
                      <div className="text-[11px] text-[#9aa0b8]">Règle PLU : {r.rule} · Existant : {r.cur}</div>
                    </div>
                    <Badge
                      className={
                        r.st === 'Conforme'
                          ? 'bg-[#2f8f5b] text-white'
                          : r.st === 'Surélévation possible'
                          ? 'bg-[#c8553d] text-white'
                          : 'bg-[#b23f28] text-white'
                      }
                    >
                      {r.st}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#7d8398]">
              Source : PLU bioclimatique de Paris · table <code className="font-mono text-[#c3c7d8]">workspace.gold.batiments_plu</code>
            </p>
          </TabsContent>

          {/* TAB 3: CAPACITÉ */}
          <TabsContent value="cap" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 rounded bg-[#1b1f2c] p-2.5 border border-[#2c3142]">
                <span className="text-[10px] text-[#9aa0b8]">SDP existante</span>
                <span className="font-mono text-base font-bold text-white">
                  {attrs.sdp_existante_m2.toLocaleString('fr-FR')} m²
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded bg-[#1b1f2c] p-2.5 border border-[#2c3142]">
                <span className="text-[10px] text-[#9aa0b8]">SDP max PLU</span>
                <span className="font-mono text-base font-bold text-white">
                  {attrs.sdp_max_plu_m2.toLocaleString('fr-FR')} m²
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded bg-[#1b1f2c] p-2.5 border border-[#c8553d]">
                <span className="text-[10px] text-[#ff7a5c]">SDP à créer</span>
                <span className="font-mono text-base font-bold text-[#ff7a5c]">
                  +{attrs.sdp_residuelle_m2.toLocaleString('fr-FR')} m²
                </span>
              </div>
            </div>

            {/* Formula Explanation */}
            <div className="rounded-md border border-[#2c3142] bg-[#1b1f2c] p-3 text-xs space-y-1.5 font-mono">
              <div className="text-[#9aa0b8]">Calcul du potentiel résiduel :</div>
              <div className="text-[#eceef5]">
                Emprise {attrs.emprise_m2} m² × ({attrs.niveaux_max} − {attrs.niveaux}) niveaux × 0,88
              </div>
              <div className="text-[#ff7a5c] font-bold">
                = {attrs.sdp_residuelle_m2.toLocaleString('fr-FR')} m² mobilisables (≈ {attrs.logts_potentiels} logements)
              </div>
            </div>

            {/* Visual Level Stacking */}
            <div className="rounded-md border border-[#2c3142] bg-[#1b1f2c] p-3 space-y-2">
              <span className="text-xs font-semibold text-[#eceef5]">Niveaux · Existant vs Potentiel PLU</span>
              <div className="flex items-end gap-6 pt-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex flex-col-reverse gap-1">
                    {Array.from({ length: attrs.niveaux }).map((_, i) => (
                      <div key={i} className="h-2.5 w-16 rounded bg-[#8a93b8]" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#9aa0b8]">{attrs.niveaux} niv. existants</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex flex-col-reverse gap-1">
                    {Array.from({ length: attrs.niveaux_max }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2.5 w-16 rounded ${
                          i < attrs.niveaux ? 'bg-[#8a93b8]' : 'bg-[#c8553d] animate-pulse'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#ff7a5c] font-semibold">{attrs.niveaux_max} niv. autorisés</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('gen')}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#c8553d] py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-[#b0402a]"
            >
              <Sparkles className="h-4 w-4" />
              Explorer les variantes de volumétries IA
            </button>
          </TabsContent>

          {/* TAB 4: GÉNÉRATION IA */}
          <TabsContent value="gen" className="space-y-3 pt-3">
            {variants && activeVariant ? (
              <>
                {/* View Mode & Variant Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded bg-[#1b1f2c] p-1 border border-[#2c3142]">
                    <button
                      type="button"
                      onClick={() => setViewMode('aerial')}
                      className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                        viewMode === 'aerial' ? 'bg-[#c8553d] text-white' : 'text-[#9aa0b8] hover:text-white'
                      }`}
                    >
                      Vue aérienne
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('street')}
                      className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                        viewMode === 'street' ? 'bg-[#c8553d] text-white' : 'text-[#9aa0b8] hover:text-white'
                      }`}
                    >
                      Vue piéton (1,65 m)
                    </button>
                  </div>
                  <span className="font-mono text-xs text-[#ff7a5c]">
                    Variante {activeVariant.id} · {activeVariant.title}
                  </span>
                </div>

                {/* 3D Generative Rendering Canvas / Image Display */}
                <div className="relative h-56 w-full overflow-hidden rounded-md border border-[#2c3142] bg-[#0d0f15]">
                  {isGenerating ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8553d] border-t-transparent" />
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-white">{GEN_STEPS[genStepIndex]}</div>
                        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[#232838]">
                          <div
                            className="h-full bg-[#c8553d] transition-all duration-300"
                            style={{ width: `${genProgress}%` }}
                          />
                        </div>
                        <div className="font-mono text-[10px] text-[#9aa0b8]">{genProgress}% · Model Serving</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={viewMode === 'aerial' ? activeVariant.aerialImg : activeVariant.streetImg}
                        alt={activeVariant.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-2 top-2 flex items-center gap-1.5">
                        <Badge className="bg-[#1b1f2c]/90 text-[10px] text-white backdrop-blur">
                          Variante {activeVariant.id}
                        </Badge>
                        <Badge className="bg-[#2f8f5b] text-[10px] text-white">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Conforme PLU
                        </Badge>
                      </div>
                      {viewMode === 'street' && (
                        <div className="absolute bottom-2 left-2 rounded bg-[#161923]/90 px-2.5 py-1 text-[11px] text-[#eceef5] backdrop-blur">
                          Vue immersive à hauteur d&rsquo;œil depuis le trottoir
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Variants Carousel */}
                <div className="grid grid-cols-3 gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`relative flex flex-col overflow-hidden rounded border text-left transition ${
                        selectedVariantId === v.id
                          ? 'border-[#c8553d] ring-1 ring-[#c8553d]'
                          : 'border-[#2c3142] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={v.aerialImg} alt={v.title} className="h-14 w-full object-cover" />
                      <div className="bg-[#1b1f2c] p-1.5">
                        <span className="font-bold text-[11px] text-white">{v.id} · {v.title}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Variant KPIs */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="rounded bg-[#1b1f2c] p-2 border border-[#2c3142]">
                    <span className="font-mono text-xs font-bold text-white">{activeVariant.sdp} m²</span>
                    <span className="block text-[10px] text-[#9aa0b8]">SDP totale</span>
                  </div>
                  <div className="rounded bg-[#1b1f2c] p-2 border border-[#2c3142]">
                    <span className="font-mono text-xs font-bold text-white">{activeVariant.emprise}%</span>
                    <span className="block text-[10px] text-[#9aa0b8]">Emprise sol</span>
                  </div>
                  <div className="rounded bg-[#1b1f2c] p-2 border border-[#2c3142]">
                    <span className="font-mono text-xs font-bold text-white">{activeVariant.niv}</span>
                    <span className="block text-[10px] text-[#9aa0b8]">Niveaux</span>
                  </div>
                  <div className="rounded bg-[#1b1f2c] p-2 border border-[#c8553d]">
                    <span className="font-mono text-xs font-bold text-[#ff7a5c]">{activeVariant.logts}</span>
                    <span className="block text-[10px] text-[#9aa0b8]">Logements</span>
                  </div>
                </div>

                {/* Re-generate Button & Prompt Inspector */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateStreet}
                    disabled={isGenerating}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded bg-[#232838] py-2 text-xs font-semibold text-[#eceef5] border border-[#3a4054] hover:bg-[#2c3142] transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Regénérer la vue piéton
                  </button>
                </div>

                <div className="rounded border border-[#2c3142] bg-[#161a25] p-2.5 font-mono text-[10px] text-[#9aa0b8] space-y-1">
                  <div className="flex justify-between text-[#eceef5]">
                    <span>Prompt synthétisé depuis BDNB + PLU</span>
                    <span className="text-[#ff7a5c]">Model Serving · Unity AI Gateway</span>
                  </div>
                  <p className="line-clamp-2 leading-relaxed text-[#c3c7d8]">{activeVariant.prompt}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-[#2c3142] bg-[#1b1f2c] p-8 text-center">
                <Building2 className="h-8 w-8 text-[#9aa0b8]" />
                <div className="space-y-1">
                  <div className="font-bold text-white">Variantes générées pour les parcelles phares</div>
                  <p className="text-xs text-[#9aa0b8]">
                    Sélectionnez l&rsquo;une des parcelles phares (Entrepôt Chevaleret, Garage Tolbiac ou Station Vincent-Auriol)
                    pour prévisualiser le rendu 3D et les volumes IA.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function FactCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 rounded border p-2.5 ${highlight ? 'border-[#c8553d] bg-[#1b1f2c]' : 'border-[#2c3142] bg-[#1b1f2c]'}`}>
      <span className="text-[10px] text-[#9aa0b8]">{label}</span>
      <span className="font-medium text-xs text-[#eceef5]">{value}</span>
    </div>
  );
}
