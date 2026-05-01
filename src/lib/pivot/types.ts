export type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max'

export type PivotValueConfig = {
  field:       string
  aggregation: AggregationType
  label?:      string
}

export type FilterCategorical = {
  field:  string
  type:   'categorical'
  values: string[]  // valeurs sélectionnées (ligne incluse si présente dans cette liste)
}

export type FilterRange = {
  field: string
  type:  'range'
  min?:  number
  max?:  number
}

export type PivotFilter = FilterCategorical | FilterRange

export type { DateGrouping } from './dateGroup'

export type DimField = {
  field:      string
  dateGroup?: import('./dateGroup').DateGrouping
}

export type PivotConfig = {
  rows:    DimField[]
  columns: DimField[]
  values:  PivotValueConfig[]
  filters: PivotFilter[]
}

export type PivotData = {
  config:     PivotConfig
  rowKeys:    string[][]
  colKeys:    string[][]
  cells:      Record<string, (number | null)[]>
  rowTotals:  Record<string, (number | null)[]>
  colTotals:  Record<string, (number | null)[]>
  grandTotal: (number | null)[]
}
