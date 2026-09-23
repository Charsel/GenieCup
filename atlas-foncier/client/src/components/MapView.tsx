import { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import type { Feature, Geometry } from 'geojson';
import { useAnalyticsQuery, Skeleton, ToggleGroup, ToggleGroupItem } from '@databricks/appkit-ui/react';
import { fillFor, mapLayerLegend, type MapLayerKey, type BuildingRow } from '../lib/mapStyle';
import 'leaflet/dist/leaflet.css';

export type { MapLayerKey, BuildingRow };

export function MapView({
  layer,
  onLayerChange,
  onSelectBuilding,
}: {
  layer: MapLayerKey;
  onLayerChange: (layer: MapLayerKey) => void;
  onSelectBuilding: (row: BuildingRow) => void;
}) {
  const { data, loading, error } = useAnalyticsQuery('batiments_perimetre', {});

  const featureCollection = useMemo(() => {
    const rows = data ?? [];
    const features: Feature<Geometry, BuildingRow>[] = [];
    for (const row of rows) {
      // The warehouse JSON transport sometimes returns this STRING column
      // already parsed into an object rather than as raw JSON text.
      const raw: unknown = row.geometry_geojson;
      try {
        const geometry = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Geometry;
        features.push({ type: 'Feature', geometry, properties: { ...row } });
      } catch {
        // skip rows with unparsable geometry
      }
    }
    return { type: 'FeatureCollection' as const, features };
  }, [data]);

  if (loading) {
    return <Skeleton className="h-full w-full rounded-md" />;
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        Erreur de chargement des bâtiments : {error}
      </div>
    );
  }

  return (
    <div className="relative isolate h-full w-full overflow-hidden rounded-md border">
      <div className="absolute right-3 top-3 z-[1000]">
        <ToggleGroup type="single" value={layer} onValueChange={(v) => v && onLayerChange(v as MapLayerKey)}>
          <ToggleGroupItem value="usage">Usages</ToggleGroupItem>
          <ToggleGroupItem value="dpe">DPE</ToggleGroupItem>
          <ToggleGroupItem value="potentiel">Potentiel</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <MapContainer center={[48.826, 2.3715]} zoom={16} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <GeoJSON
          key={layer}
          data={featureCollection}
          style={(feature): PathOptions => {
            const row = feature?.properties as BuildingRow;
            const { fill, stroke } = fillFor(row, layer);
            return { fillColor: fill, color: stroke, weight: 1, fillOpacity: 0.75 };
          }}
          onEachFeature={(feature: Feature<Geometry, BuildingRow>, layerRef: Layer) => {
            layerRef.on('click', () => onSelectBuilding(feature.properties));
          }}
        />
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1 rounded-md bg-background/90 p-2 text-xs shadow">
        {mapLayerLegend(layer).map((entry) => (
          <div key={entry.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
