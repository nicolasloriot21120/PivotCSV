import { ResponsiveBar } from '@nivo/bar'

import type { PivotData } from '@/lib/pivot/types'
import { toBarData }     from '@/lib/pivot/chart'
import { theme, COLORS, MARGIN } from '../lib/theme'
import { EmptyChart }    from './EmptyChart'

type Props = {
  data:          PivotData
  collapsedRows: string[]
  collapsedCols: string[]
  formatValue:   (v: number) => string
  chartColors:   Record<string, string>
  transpose:     boolean
}

export function BarChart({ data, collapsedRows, collapsedCols, formatValue, chartColors, transpose }: Props) {
  const { barData, keys } = toBarData(data, collapsedRows, collapsedCols, transpose)
  if (!barData.length) return <EmptyChart />
  // Avec une seule série (cas "pas de colonnes configurées"), on colore par
  // indexValue (ligne) pour que chaque barre ait sa propre teinte. Sinon, on
  // colore par série (id) — couleur par colonne, repetée pour chaque ligne.
  const singleSeries  = keys.length <= 1
  const colorMapLabels = singleSeries ? barData.map(b => String(b.id)) : keys
  const colorMap       = Object.fromEntries(
    colorMapLabels.map((k, i) => [k, chartColors[k] ?? COLORS[i % COLORS.length]])
  )
  return (
    <ResponsiveBar
      data={barData}
      keys={keys}
      indexBy="id"
      groupMode="grouped"
      theme={theme}
      colorBy={singleSeries ? 'indexValue' : 'id'}
      colors={(d: any) =>
        colorMap[String(singleSeries ? d.indexValue : d.id)] ?? COLORS[0]
      }
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
