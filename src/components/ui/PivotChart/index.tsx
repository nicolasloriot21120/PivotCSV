import { ResponsiveBar }  from '@nivo/bar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie }  from '@nivo/pie'

import type { PivotData }  from '@/lib/pivot/types'
import { toBarData, toLineData, toPieData } from '@/lib/pivot/chart'

export type ChartType = 'bar' | 'line' | 'pie'

type Props = {
  data:      PivotData
  chartType: ChartType
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

// Palette de couleurs qui ressort sur fond sombre
const COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#f87171',
  '#a78bfa', '#38bdf8', '#fb923c', '#e879f9',
]

const MARGIN = { top: 16, right: 16, bottom: 56, left: 56 }

// ─────────────────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: PivotData }) {
  const { barData, keys } = toBarData(data)
  if (!barData.length) return <Empty />
  return (
    <ResponsiveBar
      data={barData}
      keys={keys}
      indexBy="id"
      groupMode="grouped"
      theme={theme}
      colors={COLORS}
      margin={MARGIN}
      padding={0.25}
      innerPadding={2}
      enableLabel={false}
      axisBottom={{
        tickRotation: barData.length > 6 ? -35 : 0,
        tickSize: 4,
      }}
      axisLeft={{ tickSize: 4 }}
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

function LineChart({ data }: { data: PivotData }) {
  const series = toLineData(data)
  if (!series.length) return <Empty />
  return (
    <ResponsiveLine
      data={series}
      theme={theme}
      colors={COLORS}
      margin={MARGIN}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
      pointSize={6}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      enableArea={series.length === 1}
      areaOpacity={0.1}
      useMesh
      axisBottom={{
        tickRotation: series[0]?.data.length > 6 ? -35 : 0,
        tickSize: 4,
      }}
      axisLeft={{ tickSize: 4 }}
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

function PieChart({ data }: { data: PivotData }) {
  const pieData = toPieData(data)
  if (!pieData.length) return <Empty />
  return (
    <ResponsivePie
      data={pieData}
      theme={theme}
      colors={COLORS}
      margin={{ top: 24, right: 80, bottom: 40, left: 80 }}
      innerRadius={0.5}
      padAngle={1.5}
      cornerRadius={3}
      activeOuterRadiusOffset={6}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#94a3b8"
      arcLinkLabelsColor={{ from: 'color' }}
      arcLabelsSkipAngle={18}
      arcLabelsTextColor="#0f172a"
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

export function PivotChart({ data, chartType }: Props) {
  return (
    <div className="w-full h-full">
      {chartType === 'bar'  && <BarChart  data={data} />}
      {chartType === 'line' && <LineChart data={data} />}
      {chartType === 'pie'  && <PieChart  data={data} />}
    </div>
  )
}
