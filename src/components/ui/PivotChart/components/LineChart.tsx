import { ResponsiveLine } from '@nivo/line'

import type { PivotData } from '@/lib/pivot/types'
import { toLineData }    from '@/lib/pivot/chart'
import { theme, COLORS, MARGIN } from '../lib/theme'

type Props = {
  data:          PivotData
  collapsedRows: string[]
  collapsedCols: string[]
  formatValue:   (v: number) => string
  chartColors:   Record<string, string>
  transpose:     boolean
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-full text-xs text-subtle italic">
      Aucune donnée à afficher
    </div>
  )
}

export function LineChart({ data, collapsedRows, collapsedCols, formatValue, chartColors, transpose }: Props) {
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
