import type { PivotData }  from '@/lib/pivot/types'
import { BarChart }  from './components/BarChart'
import { LineChart } from './components/LineChart'
import { PieChart }  from './components/PieChart'

export type ChartType = 'bar' | 'line' | 'pie'

export { COLORS } from './lib/theme'

type Props = {
  data:           PivotData
  chartType:      ChartType
  collapsedRows:  string[]
  collapsedCols:  string[]
  formatValue:    (v: number) => string
  chartColors:    Record<string, string>
  transpose:      boolean
}

export function PivotChart({ data, chartType, collapsedRows, collapsedCols, formatValue, chartColors, transpose }: Props) {
  return (
    <div className="w-full h-full min-h-[280px]">
      {chartType === 'bar'  && <BarChart  data={data} collapsedRows={collapsedRows} collapsedCols={collapsedCols} formatValue={formatValue} chartColors={chartColors} transpose={transpose} />}
      {chartType === 'line' && <LineChart data={data} collapsedRows={collapsedRows} collapsedCols={collapsedCols} formatValue={formatValue} chartColors={chartColors} transpose={transpose} />}
      {chartType === 'pie'  && <PieChart  data={data} collapsedRows={collapsedRows} formatValue={formatValue} chartColors={chartColors} />}
    </div>
  )
}
