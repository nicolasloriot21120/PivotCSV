import { ResponsiveBar } from '@nivo/bar'

import type { PivotData } from '@/lib/pivot/types'
import { toBarData }     from '@/lib/pivot/chart'
import { theme, COLORS, MARGIN } from './theme'

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

export function BarChart({ data, collapsedRows, collapsedCols, formatValue, chartColors, transpose }: Props) {
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
