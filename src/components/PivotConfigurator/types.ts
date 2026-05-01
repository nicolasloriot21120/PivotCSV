import type { AggregationType, PivotFilter } from '@/lib/pivot/types'
import type { DateGrouping } from '@/lib/pivot/dateGroup'

export type { DateGrouping }

export type FieldType = 'string' | 'number' | 'date'

export type PlacedField = {
  field:      string
  type:       FieldType
  dateGroup?: DateGrouping
}

export type ValueField = PlacedField & {
  aggregation: AggregationType
}

export type FilterField = PlacedField & {
  // categorical
  distinctValues?: string[]
  selectedValues?: string[]
  // range
  min?: number | ''
  max?: number | ''
}

export type ConfiguratorState = {
  rows:    PlacedField[]
  columns: PlacedField[]
  values:  ValueField[]
  filters: FilterField[]
}

export type ZoneId = 'rows' | 'columns' | 'values' | 'filters'

export function emptyConfiguratorState(): ConfiguratorState {
  return { rows: [], columns: [], values: [], filters: [] }
}

export function toPivotFilters(filters: FilterField[]): PivotFilter[] {
  return filters.flatMap(f => {
    if (f.type === 'string' || f.type === 'date') {
      if (!f.selectedValues?.length) return []
      return [{ field: f.field, type: 'categorical' as const, values: f.selectedValues }]
    } else {
      const min = f.min !== '' && f.min !== undefined ? Number(f.min) : undefined
      const max = f.max !== '' && f.max !== undefined ? Number(f.max) : undefined
      if (min === undefined && max === undefined) return []
      return [{ field: f.field, type: 'range' as const, min, max }]
    }
  })
}
