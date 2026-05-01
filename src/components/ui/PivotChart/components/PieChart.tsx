import { ResponsivePie } from '@nivo/pie'

import type { PivotData } from '@/lib/pivot/types'
import { toPieData }     from '@/lib/pivot/chart'
import { theme, COLORS } from '../lib/theme'

type Props = {
  data:          PivotData
  collapsedRows: string[]
  formatValue:   (v: number) => string
  chartColors:   Record<string, string>
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-full text-xs text-subtle italic">
      Aucune donnée à afficher
    </div>
  )
}

export function PieChart({ data, collapsedRows, formatValue, chartColors }: Props) {
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
