import { ResponsiveBar }  from '@nivo/bar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie }  from '@nivo/pie'

import type { PivotData }  from '@/lib/pivot/types'
import { toBarData, toLineData, toPieData } from '@/lib/pivot/chart'

export type ChartType = 'bar' | 'line' | 'pie'

type Props = {
  data:           PivotData
  chartType:      ChartType
  collapsedRows:  string[]
  collapsedCols:  string[]
  formatValue:    (v: number) => string
  chartColors:    Record<string, string>
  transpose:      boolean
}

// Thème sombre cohérent avec l'UI de l'app
const theme = {
  background:  'transparent',
  textColor:   '#94a3b8',
  fontSize:    11,
  axis: {
    domain: { line: { stroke: '#334155', strokeWidth: 1 } },
    legend: { text: { fontSize: 11, fill: '#64748b' } },
    ticks:  {
      line: { stroke: '#334155', strokeWidth: 1 },
      text: { fontSize: 11, fill: '#94a3b8' },
    },
  },
  grid:    { line: { stroke: '#1e293b', strokeWidth: 1 } },
  legends: { text: { fontSize: 11, fill: '#94a3b8' } },
  tooltip: {
    container: {
      background:   '#0f172a',
      color:        '#e2e8f0',
      fontSize:     12,
      border:       '1px solid #334155',
      borderRadius: '6px',
      boxShadow:    '0 4px 12px rgba(0,0,0,0.4)',
    },
  },
}

// Palette Tableau-10 adaptée fond sombre — teintes désaturées, lisiblité éprouvée
export const COLORS = [
  '#5b9cf6',  // blue
  '#f5a623',  // amber
  '#3ecf8e',  // emerald
  '#f26868',  // coral
  '#a78bfa',  // violet
  '#22d3ee',  // cyan
  '#fb923c',  // orange
  '#c084fc',  // purple
  '#34d399',  // mint
  '#f472b6',  // rose
]

const MARGIN = { top: 16, right: 16, bottom: 56, left: 56 }

// ─────────────────────────────────────────────────────────────────────────────

function BarChart({ data, collapsedRows, collapsedCols, formatValue, chartColors, transpose }: { data: PivotData; collapsedRows: string[]; collapsedCols: string[]; formatValue: (v: number) => string; chartColors: Record<string, string>; transpose: boolean }) {
  const { barData, keys } = toBarData(data, collapsedRows, collapsedCols, transpose)
  if (!barData.length) return <Empty />
  const colorMap = Object.fromEntries(keys.map((k, i) => [k, chartColors[k] ?? COLORS[i % COLORS.length]]))
  return (
    <ResponsiveBar
      data={barData}
      keys={keys}
      indexBy="id"
      groupMode="grouped"
      theme={theme}
      colors={(d: any) => colorMap[String(d.id)] ?? COLORS[0]}
      margin={MARGIN}
      padding={0.25}
      innerPadding={2}
      enableLabel={false}
      valueFormat={v => formatValue(v)}
      axisBottom={{
        tickRotation: barData.length > 6 ? -35 : 0,
        tickSize: 4,
      }}
      axisLeft={{ tickSize: 4, format: v => formatValue(Number(v)) }}
      legends={keys.length > 1 ? [{
        dataFrom:      'keys',
        anchor:        'bottom',
        direction:     'row',
        translateY:    52,
        itemWidth:     80,
        itemHeight:    14,
        itemsSpacing:  8,
        symbolSize:    10,
        symbolShape:   'circle',
      }] : []}
    />
  )
}

function LineChart({ data, collapsedRows, collapsedCols, formatValue, chartColors, transpose }: { data: PivotData; collapsedRows: string[]; collapsedCols: string[]; formatValue: (v: number) => string; chartColors: Record<string, string>; transpose: boolean }) {
  const series = toLineData(data, collapsedRows, collapsedCols, transpose)
  if (!series.length) return <Empty />
  const colorMap = Object.fromEntries(series.map((s, i) => [String(s.id), chartColors[String(s.id)] ?? COLORS[i % COLORS.length]]))
  return (
    <ResponsiveLine
      data={series}
      theme={theme}
      colors={(s: any) => colorMap[String(s.id)] ?? COLORS[0]}
      margin={MARGIN}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 0, max: 'auto', nice: true }}
      curve="monotoneX"
      pointSize={6}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      enableArea={series.length === 1}
      areaOpacity={0.1}
      useMesh
      yFormat={v => formatValue(Number(v))}
      axisBottom={{
        tickRotation: series[0]?.data.length > 6 ? -35 : 0,
        tickSize: 4,
      }}
      axisLeft={{ tickSize: 4, format: v => formatValue(Number(v)) }}
      legends={series.length > 1 ? [{
        anchor:        'bottom',
        direction:     'row',
        translateY:    52,
        itemWidth:     80,
        itemHeight:    14,
        itemsSpacing:  8,
        symbolSize:    10,
        symbolShape:   'circle',
      }] : []}
    />
  )
}

function PieChart({ data, collapsedRows, formatValue, chartColors }: { data: PivotData; collapsedRows: string[]; formatValue: (v: number) => string; chartColors: Record<string, string> }) {
  const pieData = toPieData(data, collapsedRows)
  if (!pieData.length) return <Empty />
  const colorMap = Object.fromEntries(pieData.map((d, i) => [d.id, chartColors[d.id] ?? COLORS[i % COLORS.length]]))
  return (
    <ResponsivePie
      data={pieData}
      theme={theme}
      colors={(d: any) => colorMap[d.id] ?? COLORS[0]}
      margin={{ top: 24, right: 80, bottom: 40, left: 80 }}
      innerRadius={0.5}
      padAngle={1.5}
      cornerRadius={3}
      activeOuterRadiusOffset={6}
      valueFormat={v => formatValue(v)}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#94a3b8"
      arcLinkLabelsColor={{ from: 'color' }}
      arcLabelsSkipAngle={18}
      arcLabelsTextColor="#e2e8f0"
    />
  )
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-full text-xs text-subtle italic">
      Aucune donnée à afficher
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function PivotChart({ data, chartType, collapsedRows, collapsedCols, formatValue, chartColors, transpose }: Props) {
  return (
    <div className="w-full h-full min-h-[280px]">
      {chartType === 'bar'  && <BarChart  data={data} collapsedRows={collapsedRows} collapsedCols={collapsedCols} formatValue={formatValue} chartColors={chartColors} transpose={transpose} />}
      {chartType === 'line' && <LineChart data={data} collapsedRows={collapsedRows} collapsedCols={collapsedCols} formatValue={formatValue} chartColors={chartColors} transpose={transpose} />}
      {chartType === 'pie'  && <PieChart  data={data} collapsedRows={collapsedRows} formatValue={formatValue} chartColors={chartColors} />}
    </div>
  )
}
