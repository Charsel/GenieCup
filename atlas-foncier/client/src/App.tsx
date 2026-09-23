import { useState } from 'react';
import { Badge } from '@databricks/appkit-ui/react';
import { MapView, type MapLayerKey, type BuildingRow } from './components/MapView';
import { AssistantChat } from './components/AssistantChat';
import { PerimeterSummary } from './components/PerimeterSummary';
import { ParcelSheet } from './components/ParcelSheet';

export default function App() {
  const [layer, setLayer] = useState<MapLayerKey>('usage');
  const [selected, setSelected] = useState<BuildingRow | null>(null);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-3 md:px-6">
        <h1 className="text-lg font-semibold">Atlas Foncier</h1>
        <nav aria-label="Fil d'Ariane" className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <span>France</span>
          <span aria-hidden>›</span>
          <span>Paris</span>
          <span aria-hidden>›</span>
          <span className="font-medium text-foreground">13e arrondissement</span>
        </nav>
        <Badge variant="outline" className="ml-auto">
          Cadastre + BDNB réels · PLU à venir
        </Badge>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 md:grid-cols-[320px_1fr_320px] md:p-6">
        <div className="min-h-[320px] md:min-h-0">
          <AssistantChat />
        </div>

        <div className="min-h-[420px] md:min-h-0">
          <MapView layer={layer} onLayerChange={setLayer} onSelectBuilding={setSelected} />
        </div>

        <div className="min-h-0 overflow-y-auto">
          <PerimeterSummary />
        </div>
      </main>

      <ParcelSheet row={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
