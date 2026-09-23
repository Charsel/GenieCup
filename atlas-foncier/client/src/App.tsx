import { useState, useMemo } from 'react';
import { Badge, useAnalyticsQuery } from '@databricks/appkit-ui/react';
import { DeckMap3D, type MapLayerKey, type BuildingRow } from './components/DeckMap3D';
import { AssistantChat } from './components/AssistantChat';
import { PerimeterSummary } from './components/PerimeterSummary';
import { ParcelSheet } from './components/ParcelSheet';
import { IntroGlobe } from './components/IntroGlobe';
import { HERO_BUILDINGS, getBuildingAttributes } from './lib/demoAttributes';
import { Search, RotateCcw, Building2 } from 'lucide-react';

export default function App() {
  const [layer, setLayer] = useState<MapLayerKey>('usage');
  const [selected, setSelected] = useState<BuildingRow | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const { data } = useAnalyticsQuery('batiments_perimetre', {});
  const rowsList = (Array.isArray(data) ? data : []) as BuildingRow[];

  // Handle direct selection by ID (e.g. from Chat or Top Parcels)
  const handleSelectById = (id: string) => {
    const matched = rowsList.find((r) => r.batiment_groupe_id === id);
    if (matched) {
      setSelected(matched);
      setHighlightedIds([id]);
    } else if (HERO_BUILDINGS[id]) {
      // Mock hero fallback row
      const hero = HERO_BUILDINGS[id];
      const fallbackRow: BuildingRow = {
        batiment_groupe_id: id,
        commune_insee: '75113',
        centroid_lon: 2.3715,
        centroid_lat: 48.826,
        geometry_geojson: '',
        adresse: hero.adresse,
        hauteur_m: hero.hauteur_m,
        dpe_classe: hero.dpe_classe,
        conso_kwh_m2_an: hero.conso_kwh_m2_an,
        sdp_existante_m2: hero.sdp_existante_m2,
        zone_plu: hero.zone_plu,
        plafond_hauteur_m: hero.plafond_hauteur_m,
        sdp_residuelle_m2: hero.sdp_residuelle_m2,
      };
      setSelected(fallbackRow);
      setHighlightedIds([id]);
    }
  };

  // Search filtering
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return rowsList
      .map((r) => ({
        row: r,
        attrs: getBuildingAttributes(r.batiment_groupe_id, r),
      }))
      .filter(
        ({ attrs }) =>
          attrs.adresse.toLowerCase().includes(q) ||
          attrs.parcelle.toLowerCase().includes(q) ||
          attrs.bdnb_id.toLowerCase().includes(q) ||
          (attrs.name && attrs.name.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [searchQuery, rowsList]);

  return (
    <div className="flex h-screen flex-col bg-[#0d0f15] text-[#eceef5] select-none">
      {showIntro && <IntroGlobe onComplete={() => setShowIntro(false)} />}

      {/* Top Header Bar */}
      <header className="flex h-14 items-center gap-4 border-b border-[#2c3142] bg-[#141720]/95 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c8553d] text-white shadow-md">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">Atlas Foncier</span>
        </div>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Fil d'Ariane" className="hidden items-center gap-1.5 text-xs text-[#9aa0b8] md:flex">
          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#232838] hover:text-white transition"
          >
            <RotateCcw className="h-3 w-3" />
            Terre
          </button>
          <span aria-hidden className="text-[#4e556e]">›</span>
          <span>France</span>
          <span aria-hidden className="text-[#4e556e]">›</span>
          <span>Paris</span>
          <span aria-hidden className="text-[#4e556e]">›</span>
          <span className="font-semibold text-white">13e arrondissement</span>
          {selected && (
            <>
              <span aria-hidden className="text-[#4e556e]">›</span>
              <span className="font-semibold text-[#ff7a5c]">
                {getBuildingAttributes(selected.batiment_groupe_id, selected).adresse}
              </span>
            </>
          )}
        </nav>

        {/* Global Search Bar */}
        <div className="relative ml-auto w-64 md:w-80">
          <div className="flex items-center gap-2 rounded-md border border-[#2c3142] bg-[#0d0f15] px-2.5 py-1.5 text-xs text-white">
            <Search className="h-3.5 w-3.5 text-[#9aa0b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Rechercher une adresse, parcelle (75113...)"
              className="flex-1 bg-transparent placeholder-[#6f7690] focus:outline-none text-xs"
            />
          </div>

          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-[#2c3142] bg-[#161a25] p-1 shadow-2xl">
              {searchResults.map(({ row, attrs }) => (
                <button
                  key={attrs.id}
                  type="button"
                  onClick={() => {
                    setSelected(row);
                    setHighlightedIds([attrs.id]);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex w-full items-center justify-between rounded p-2 text-left text-xs transition hover:bg-[#232838]"
                >
                  <div>
                    <div className="font-semibold text-white">{attrs.name || attrs.adresse}</div>
                    <div className="text-[10px] text-[#9aa0b8]">Parcelle {attrs.parcelle} · BDNB {attrs.bdnb_id}</div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#ff7a5c]">{attrs.hauteur_m} m</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Badge variant="outline" className="border-[#3a4054] bg-[#1b1f2c] text-[11px] text-[#ff7a5c]">
          3D Deck.gl + Unity Catalog
        </Badge>
      </header>

      {/* Main 3-Column 3D Urban Studio Grid */}
      <main className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-[330px_1fr_330px]">
        {/* Left Column: Assistant Territoire (Chat NL -> SQL) */}
        <div className="h-full min-h-0 overflow-hidden">
          <AssistantChat onSelectBuildingId={handleSelectById} />
        </div>

        {/* Center: Interactive 3D DeckGL Map with Lighting, Extrusion & PLU Ghost Envelope */}
        <div className="h-full min-h-0 overflow-hidden">
          <DeckMap3D
            layer={layer}
            onLayerChange={setLayer}
            onSelectBuilding={(b) => {
              setSelected(b);
              setHighlightedIds([b.batiment_groupe_id]);
            }}
            selectedBuilding={selected}
            highlightedIds={highlightedIds}
          />
        </div>

        {/* Right Column: Perimeter Potential & Top Parcelles */}
        <div className="h-full min-h-0 overflow-hidden">
          <PerimeterSummary onSelectBuildingId={handleSelectById} />
        </div>
      </main>

      {/* 4-Tab Full Parcel Sheet (BDNB, PLU, Capacité, Génération IA) */}
      <ParcelSheet
        row={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setHighlightedIds([]);
          }
        }}
      />
    </div>
  );
}

