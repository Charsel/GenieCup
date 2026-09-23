import { useMemo, useState } from 'react';
import {
  BaseChart,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  getCompatibleChartTypes,
  inferChartType,
  transformGenieData,
} from '@databricks/appkit-ui/react';
import type { GenieColumnMeta, GenieStatementResponse } from '@databricks/appkit-ui/react';
import { BarChart3, Download, Maximize2, Table2 } from 'lucide-react';

type ChartType = NonNullable<ReturnType<typeof inferChartType>>['chartType'];

// Mockup palette (accent first, then the usage colors).
const COLORS = ['#c8553d', '#7fb89f', '#86a9da', '#dcbf85', '#8f86d6', '#e7a48c', '#b9b8c6'];
const TABLE_ROW_LIMIT = 50;
// Tighter plot margins so the narrow chat panel keeps room for the bars.
const CARTESIAN = new Set(['bar', 'line', 'area', 'scatter']);
const compactFr = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * ECharts overrides: tight grid everywhere, plus a compact, sparse value axis for bars
 * (always drawn horizontally — category labels stay readable in the 330 px chat panel).
 */
function chartOptions(type: ChartType, compact: boolean): Record<string, unknown> | undefined {
  if (!CARTESIAN.has(type)) return undefined;
  const grid = { left: 4, right: 14, top: 10, bottom: 4, containLabel: true };
  if (type !== 'bar') return { grid };
  return {
    grid,
    xAxis: {
      type: 'value',
      splitNumber: compact ? 3 : 5,
      axisLabel: { color: '#9aa0b8', fontSize: compact ? 9 : 11, formatter: (v: number) => compactFr.format(v) },
      splitLine: { lineStyle: { color: '#232838' } },
    },
  };
}

const CHART_LABELS: Record<ChartType, string> = {
  bar: 'Barres',
  line: 'Courbe',
  area: 'Aire',
  pie: 'Camembert',
  donut: 'Anneau',
  scatter: 'Nuage',
  radar: 'Radar',
  heatmap: 'Carte de chaleur',
};

function asText(value: unknown): string {
  if (value == null) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value as string | number | boolean);
}

function formatCell(value: unknown, col: GenieColumnMeta): string {
  if (value == null) return '—';
  if (col.category === 'numeric' && typeof value === 'number') {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }
  return asText(value);
}

function toCsv(rows: Record<string, unknown>[], columns: GenieColumnMeta[]): string {
  const esc = (v: unknown) => {
    const s = asText(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.name)).join(';');
  return [header, ...rows.map((r) => columns.map((c) => esc(r[c.name])).join(';'))].join('\n');
}

function downloadCsv(rows: Record<string, unknown>[], columns: GenieColumnMeta[]) {
  // BOM so Excel opens accents correctly.
  const blob = new Blob(['\ufeff' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'genie-resultats.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** Single-row, all-numeric results (COUNT, SUM, AVG…) read best as KPI tiles. */
function StatTiles({ row, columns }: { row: Record<string, unknown>; columns: GenieColumnMeta[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {columns.map((c) => (
        <div key={c.name} className="rounded border border-[#2c3142] bg-[#161a25] px-2 py-1.5">
          <div className="font-mono text-base font-bold text-[#ff7a5c]">{formatCell(row[c.name], c)}</div>
          <div className="truncate text-[10px] text-[#9aa0b8]" title={c.name}>
            {c.name.replace(/_/g, ' ')}
          </div>
        </div>
      ))}
    </div>
  );
}

function DataGrid({
  rows,
  columns,
  maxHeight,
}: {
  rows: Record<string, unknown>[];
  columns: GenieColumnMeta[];
  maxHeight: number;
}) {
  const shown = rows.slice(0, TABLE_ROW_LIMIT);
  return (
    <div className="overflow-auto rounded border border-[#2c3142]" style={{ maxHeight }}>
      <table className="w-full border-collapse text-[10px]">
        <thead className="sticky top-0 bg-[#1b1f2c]">
          <tr>
            {columns.map((c) => (
              <th
                key={c.name}
                className={`border-b border-[#2c3142] px-2 py-1 font-semibold whitespace-nowrap text-[#c3c7d8] ${
                  c.category === 'numeric' ? 'text-right' : 'text-left'
                }`}
              >
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            // Genie rows have no stable id; position is the identity here.
            // eslint-disable-next-line react/no-array-index-key
            <tr key={i} className="odd:bg-[#0d0f15] even:bg-[#12151e] hover:bg-[#232838]">
              {columns.map((c) => {
                const text = formatCell(r[c.name], c);
                return (
                  <td
                    key={c.name}
                    title={text}
                    className={`max-w-[240px] truncate border-b border-[#1b1f2c] px-2 py-1 text-[#eceef5] ${
                      c.category === 'numeric' ? 'text-right font-mono' : ''
                    }`}
                  >
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > TABLE_ROW_LIMIT && (
        <p className="bg-[#12151e] px-2 py-1 text-[10px] text-[#7d8398]">
          {TABLE_ROW_LIMIT} premières lignes sur {rows.length.toLocaleString('fr-FR')} — export CSV pour tout voir.
        </p>
      )}
    </div>
  );
}

/**
 * Visual rendering of a Genie query result, in the mockup's dark palette:
 * KPI tiles for single-row aggregates, otherwise chart (when Genie data fits one)
 * + table, with chart-type switch, CSV export and an enlarged view.
 */
export function GenieVisual({ data, title }: { data: GenieStatementResponse; title?: string }) {
  const transformed = useMemo(() => transformGenieData(data), [data]);
  const { inference, compatible } = useMemo(() => {
    if (!transformed) return { inference: null, compatible: [] as ChartType[] };
    return {
      inference: inferChartType(transformed.rows, transformed.columns),
      compatible: getCompatibleChartTypes(transformed.rows, transformed.columns),
    };
  }, [transformed]);
  const [view, setView] = useState<'chart' | 'table' | null>(null);
  const [chartType, setChartType] = useState<ChartType | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!transformed || transformed.rows.length === 0) return null;
  const { rows, columns } = transformed;

  const isStat = rows.length === 1 && columns.length <= 4 && columns.every((c) => c.category === 'numeric');
  const activeType = chartType && compatible.includes(chartType) ? chartType : (inference?.chartType ?? null);
  const activeView = view ?? (activeType ? 'chart' : 'table');

  const renderChart = (height: number, compact: boolean) =>
    inference && activeType ? (
      <BaseChart
        data={rows}
        chartType={activeType}
        xKey={inference.xKey}
        yKey={inference.yKey}
        height={height}
        colors={COLORS}
        showLegend={Array.isArray(inference.yKey) || activeType === 'pie' || activeType === 'donut'}
        innerRadius={activeType === 'donut' ? 55 : undefined}
        orientation={activeType === 'bar' ? 'horizontal' : undefined}
        options={chartOptions(activeType, compact)}
      />
    ) : null;

  const body = (large: boolean) =>
    isStat ? (
      <StatTiles row={rows[0]} columns={columns} />
    ) : activeView === 'chart' && activeType ? (
      renderChart(large ? 420 : 200, !large)
    ) : (
      <DataGrid rows={rows} columns={columns} maxHeight={large ? 520 : 220} />
    );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1">
      {!isStat && activeType && (
        <div className="flex rounded border border-[#2c3142] p-0.5">
          {(['chart', 'table'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] transition ${
                activeView === v ? 'bg-[#c8553d] text-white' : 'text-[#9aa0b8] hover:text-white'
              }`}
            >
              {v === 'chart' ? <BarChart3 className="h-3 w-3" /> : <Table2 className="h-3 w-3" />}
              {v === 'chart' ? 'Graphique' : 'Tableau'}
            </button>
          ))}
        </div>
      )}
      <span className="ml-auto font-mono text-[10px] text-[#7d8398]">
        {rows.length.toLocaleString('fr-FR')} ligne{rows.length > 1 ? 's' : ''}
      </span>
      <button
        type="button"
        title="Exporter en CSV"
        onClick={() => downloadCsv(rows, columns)}
        className="rounded p-1 text-[#9aa0b8] transition hover:bg-[#232838] hover:text-white"
      >
        <Download className="h-3 w-3" />
      </button>
      {!isStat && (
        <button
          type="button"
          title="Agrandir"
          onClick={() => setExpanded(true)}
          className="rounded p-1 text-[#9aa0b8] transition hover:bg-[#232838] hover:text-white"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  const typeChips =
    !isStat && activeView === 'chart' && compatible.length > 1 ? (
      <div className="flex flex-wrap gap-1">
        {compatible.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setChartType(t)}
            className={`rounded-full border px-1.5 py-px text-[9px] transition ${
              t === activeType
                ? 'border-[#c8553d] text-[#ff7a5c]'
                : 'border-[#2c3142] text-[#7d8398] hover:border-[#3a4054] hover:text-white'
            }`}
          >
            {CHART_LABELS[t]}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="genie-viz space-y-1.5 rounded border border-[#2c3142] bg-[#0d0f15] p-2">
      {toolbar}
      {typeChips}
      {body(false)}

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="genie-viz max-w-4xl border-[#2c3142] bg-[#141720] text-[#eceef5] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-sm text-white">{title || 'Résultat Genie'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {toolbar}
            {typeChips}
            {body(true)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
