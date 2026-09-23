import { useState, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import { useAnalyticsQuery } from '@databricks/appkit-ui/react';
import {
  type MapLayerKey,
  type BuildingRow,
  getBuildingColorRGBA,
  getBuildingHeight,
  COLOR_PALETTE,
  mapLayerLegend,
} from '../lib/mapStyle';
import { getBuildingAttributes, generateDemoPerimeterFeatures } from '../lib/demoAttributes';
import { Compass, ZoomIn, ZoomOut, Box } from 'lucide-react';

export type { MapLayerKey, BuildingRow };

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  maxPitch?: number;
  minZoom?: number;
  maxZoom?: number;
}

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 2.3715,
  latitude: 48.826,
  zoom: 16.2,
  pitch: 52,
  bearing: -25,
  maxPitch: 85,
  minZoom: 14,
  maxZoom: 20,
};

// Advanced lighting for architectural 3D rendering
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.2,
});

const dirLight = new DirectionalLight({
  color: [255, 250, 240],
  intensity: 2.4,
  direction: [-1, -2, -3],
  _shadow: true,
});

const lightingEffect = new LightingEffect({ ambientLight, dirLight });

const material = {
  ambient: 0.35,
  diffuse: 0.65,
  shininess: 32,
  specularColor: [60, 64, 80] as [number, number, number],
};

const pluMaterial = {
  ambient: 0.8,
  diffuse: 0.2,
  shininess: 0,
  specularColor: [0, 0, 0] as [number, number, number],
};

export function DeckMap3D({
  layer,
  onLayerChange,
  onSelectBuilding,
  selectedBuilding,
  highlightedIds = [],
}: {
  layer: MapLayerKey;
  onLayerChange: (layer: MapLayerKey) => void;
  onSelectBuilding: (row: BuildingRow) => void;
  selectedBuilding?: BuildingRow | null;
  highlightedIds?: string[];
}) {
  const { data, loading } = useAnalyticsQuery('batiments_perimetre', {});
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    feature?: Feature<Geometry, BuildingRow>;
  } | null>(null);

  // Convert raw DB rows to GeoJSON FeatureCollection (with rich fallback)
  const featureCollection = useMemo(() => {
    const rows = (Array.isArray(data) ? data : []) as BuildingRow[];
    const features: Feature<Geometry, BuildingRow>[] = [];
    for (const row of rows) {
      const raw: unknown = row.geometry_geojson;
      try {
        const geometry = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Geometry;
        if (geometry) {
          features.push({
            type: 'Feature',
            geometry,
            properties: { ...row },
          });
        }
      } catch {
        // Skip malformed geojson
      }
    }

    if (features.length === 0) {
      return {
        type: 'FeatureCollection' as const,
        features: generateDemoPerimeterFeatures() as Feature<Geometry, BuildingRow>[],
      };
    }

    return { type: 'FeatureCollection' as const, features };
  }, [data]);

  const selectedFeature = useMemo(() => {
    if (!selectedBuilding) return null;
    return featureCollection.features.find(
      (f) => f.properties.batiment_groupe_id === selectedBuilding.batiment_groupe_id
    );
  }, [selectedBuilding, featureCollection]);

  // DeckGL Layers definition
  const deckLayers = useMemo(() => {
    const layersList = [];

    // 0. Basemap (raster tiles, rendered as a deck.gl layer so it shares the
    // same 3D perspective/camera as the buildings — no separate map library needed)
    layersList.push(
      new TileLayer({
        id: 'basemap-tiles',
        data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        renderSubLayers: (props: any) => {
          const { boundingBox } = props.tile;
          return new BitmapLayer(props, {
            data: undefined,
            image: props.data,
            bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
          });
        },
      })
    );

    // 1. Base 3D Buildings Layer
    layersList.push(
      new GeoJsonLayer({
        id: 'buildings-3d-layer',
        data: featureCollection,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: true,
        wireframe: true,
        getElevation: (f: any) => getBuildingHeight(f.properties, 'current') * 1.6,
        getFillColor: (f: any) => {
          const row = f.properties as BuildingRow;
          const isSelected = selectedBuilding?.batiment_groupe_id === row.batiment_groupe_id;
          const isHighlighted = highlightedIds.includes(row.batiment_groupe_id);
          return getBuildingColorRGBA(row, layer, isSelected, isHighlighted);
        },
        getLineColor: (f: any) => {
          const row = f.properties as BuildingRow;
          if (selectedBuilding?.batiment_groupe_id === row.batiment_groupe_id) {
            return [255, 122, 92, 255];
          }
          if (highlightedIds.includes(row.batiment_groupe_id)) {
            return [255, 220, 100, 255];
          }
          return [30, 36, 50, 180];
        },
        getLineWidth: (f: any) => {
          const row = f.properties as BuildingRow;
          return selectedBuilding?.batiment_groupe_id === row.batiment_groupe_id ? 2 : 0.8;
        },
        lineWidthUnits: 'pixels',
        material,
        updateTriggers: {
          getFillColor: [layer, selectedBuilding?.batiment_groupe_id, highlightedIds],
          getLineColor: [selectedBuilding?.batiment_groupe_id, highlightedIds],
          getLineWidth: [selectedBuilding?.batiment_groupe_id],
        },
        onHover: (info) => {
          if (info.object) {
            setHoverInfo({
              x: info.x,
              y: info.y,
              feature: info.object as Feature<Geometry, BuildingRow>,
            });
          } else {
            setHoverInfo(null);
          }
        },
        onClick: (info) => {
          if (info.object) {
            const row = (info.object as Feature<Geometry, BuildingRow>).properties;
            onSelectBuilding(row);
          }
        },
      })
    );

    // 2. PLU Ghost Gabarit Envelope (when a building or hero is selected)
    if (selectedFeature) {
      layersList.push(
        new GeoJsonLayer({
          id: 'selected-plu-envelope',
          data: {
            type: 'FeatureCollection',
            features: [selectedFeature],
          },
          pickable: false,
          stroked: true,
          filled: true,
          extruded: true,
          wireframe: true,
          getElevation: (f: any) => getBuildingHeight(f.properties, 'plu') * 1.6,
          getFillColor: () => COLOR_PALETTE.pluEnvelope,
          getLineColor: () => COLOR_PALETTE.pluWireframe,
          getLineWidth: 2,
          lineWidthUnits: 'pixels',
          material: pluMaterial,
        })
      );
    }

    return layersList;
  }, [featureCollection, layer, selectedBuilding, selectedFeature, highlightedIds, onSelectBuilding]);

  const handleResetCamera = useCallback(() => {
    setViewState(INITIAL_VIEW_STATE);
  }, []);

  const handleTopView = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      pitch: 0,
      bearing: 0,
    }));
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setViewState((prev) => ({
      ...prev,
      zoom: Math.min(20, Math.max(14, prev.zoom + delta)),
    }));
  }, []);

  if (loading && (!featureCollection || featureCollection.features.length === 0)) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-[#0d0f15]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#c8553d] border-t-transparent" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#9aa0b8]">
            Chargement de la volumétrie 3D...
          </span>
        </div>
      </div>
    );
  }

  const hoveredAttrs = hoverInfo?.feature
    ? getBuildingAttributes(hoverInfo.feature.properties.batiment_groupe_id, hoverInfo.feature.properties)
    : null;

  return (
    <div className="relative isolate h-full w-full select-none overflow-hidden rounded-md border border-[#2c3142] bg-[#0d0f15]">
      {/* 3D Canvas Container */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nextViewState }: any) => setViewState(nextViewState)}
        controller={{ doubleClickZoom: true, dragRotate: true, keyboard: true }}
        layers={deckLayers}
        effects={[lightingEffect]}
        getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
      />

      {/* Top Left Layer Selector */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1 rounded-md border border-[#2c3142] bg-[#161923]/90 p-1 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => onLayerChange('usage')}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
              layer === 'usage'
                ? 'bg-[#c8553d] text-white shadow-md'
                : 'text-[#9aa0b8] hover:bg-[#232838] hover:text-[#eceef5]'
            }`}
          >
            Usages
          </button>
          <button
            type="button"
            onClick={() => onLayerChange('dpe')}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
              layer === 'dpe'
                ? 'bg-[#c8553d] text-white shadow-md'
                : 'text-[#9aa0b8] hover:bg-[#232838] hover:text-[#eceef5]'
            }`}
          >
            DPE
          </button>
          <button
            type="button"
            onClick={() => onLayerChange('potentiel')}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
              layer === 'potentiel'
                ? 'bg-[#c8553d] text-white shadow-md'
                : 'text-[#9aa0b8] hover:bg-[#232838] hover:text-[#eceef5]'
            }`}
          >
            Potentiel
          </button>
        </div>
      </div>

      {/* Top Right 3D Camera Controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5 rounded-md border border-[#2c3142] bg-[#161923]/90 p-1 backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={() => handleZoom(0.8)}
          title="Zoomer (+)"
          className="flex h-8 w-8 items-center justify-center rounded text-[#9aa0b8] transition hover:bg-[#232838] hover:text-white"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.8)}
          title="Dézoomer (-)"
          className="flex h-8 w-8 items-center justify-center rounded text-[#9aa0b8] transition hover:bg-[#232838] hover:text-white"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="my-0.5 h-[1px] bg-[#2c3142]" />
        <button
          type="button"
          onClick={handleResetCamera}
          title="Vue 3D perspective"
          className="flex h-8 w-8 items-center justify-center rounded text-[#9aa0b8] transition hover:bg-[#232838] hover:text-[#ff7a5c]"
        >
          <Box className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleTopView}
          title="Vue du dessus (2D)"
          className="flex h-8 w-8 items-center justify-center rounded text-[#9aa0b8] transition hover:bg-[#232838] hover:text-[#ff7a5c]"
        >
          <Compass className="h-4 w-4" />
        </button>
      </div>

      {/* Floating 3D Badge on selected building */}
      {selectedBuilding && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-md border border-[#c8553d] bg-[#161923]/95 px-3 py-2 text-xs text-[#eceef5] backdrop-blur-md shadow-2xl">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#ff7a5c] animate-pulse" />
          <span className="font-medium">
            Gabarit PLU actif · Plafond {getBuildingAttributes(selectedBuilding.batiment_groupe_id, selectedBuilding).plafond_hauteur_m} m
          </span>
        </div>
      )}

      {/* Bottom Left Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex max-w-[280px] flex-col gap-1.5 rounded-md border border-[#2c3142] bg-[#161923]/92 p-2.5 text-xs text-[#c3c7d8] backdrop-blur-md shadow-2xl">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#7d8398]">
          Légende · {layer.toUpperCase()}
        </span>
        <div className="flex flex-col gap-1">
          {mapLayerLegend(layer).map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-sm shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-[11px] text-[#eceef5]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Hover Tooltip */}
      {hoverInfo && hoveredAttrs && (
        <div
          className="pointer-events-none absolute z-50 flex -translate-x-1/2 -translate-y-full flex-col gap-1 rounded-md border border-[#3a4054] bg-[#1a1e2b]/95 p-2.5 text-xs text-[#eceef5] shadow-2xl backdrop-blur-md"
          style={{ left: hoverInfo.x, top: hoverInfo.y - 12 }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-[#ffffff]">{hoveredAttrs.adresse}</span>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-white ${
                hoveredAttrs.dpe_classe === 'F' || hoveredAttrs.dpe_classe === 'G'
                  ? 'bg-[#c8553d]'
                  : 'bg-[#4462c9]'
              }`}
            >
              DPE {hoveredAttrs.dpe_classe}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#9aa0b8]">
            <span>H: {hoveredAttrs.hauteur_m} m (Plafond {hoveredAttrs.plafond_hauteur_m} m)</span>
            <span>{hoveredAttrs.niveaux} / {hoveredAttrs.niveaux_max} niv.</span>
          </div>
          {hoveredAttrs.sdp_residuelle_m2 > 0 && (
            <div className="font-mono text-[11px] font-medium text-[#ff7a5c]">
              + {hoveredAttrs.sdp_residuelle_m2.toLocaleString('fr-FR')} m² résiduels
            </div>
          )}
        </div>
      )}
    </div>
  );
}
