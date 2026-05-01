import { useState } from 'react'
import {
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import type { RawRow }          from '@/lib/loader'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { AggregationType } from '@/lib/pivot/types'
import { isDateLike }           from '@/lib/pivot/dateGroup'
import { collectDistinctStringValues } from '@/lib/utils/records'
import type {
  ConfiguratorState, DateGrouping, FieldType,
  FilterField, PlacedField, ValueField, ZoneId,
} from './types'
import { toPivotFilters } from './types'

export type UsePivotConfiguratorProps = {
  value:          ConfiguratorState
  onChange:       (s: ConfiguratorState) => void
  headers:        string[]
  preview:        RawRow[]
  distinctValues: Record<string, string[]>
  status:         'idle' | 'computing' | 'done' | 'error'
  onCompute:      (config: PivotConfig) => void
}

const EXCLUSIVE_ZONES: ZoneId[] = ['rows', 'columns', 'values']

function inferType(rows: RawRow[], field: string): FieldType {
  for (const row of rows) {
    const v = row[field]
    if (v !== null && v !== undefined && v !== '') {
      if (typeof v === 'number') return 'number'
      if (isDateLike(String(v))) return 'date'
      return 'string'
    }
  }
  return 'string'
}

export function usePivotConfigurator({
  value, onChange, headers, preview, distinctValues, status, onCompute,
}: UsePivotConfiguratorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const [dragging, setDragging] = useState<{ field: string; type: FieldType } | null>(null)

  const fieldTypes: Record<string, FieldType> = {}
  for (const h of headers) fieldTypes[h] = inferType(preview, h)

  const placedInExclusive = new Set(
    [...value.rows, ...value.columns, ...value.values].map(f => f.field)
  )
  const available = headers
    .filter(h => !placedInExclusive.has(h))
    .map(h => ({ field: h, type: fieldTypes[h] }))

  const removeFromZone = (zone: keyof ConfiguratorState, field: string) =>
    onChange({ ...value, [zone]: (value[zone] as PlacedField[]).filter(f => f.field !== field) })

  const addToZone = (zone: ZoneId, field: string, type: FieldType) => {
    let next = { ...value }

    if (EXCLUSIVE_ZONES.includes(zone)) {
      for (const z of EXCLUSIVE_ZONES) {
        next = { ...next, [z]: (next[z] as PlacedField[]).filter(f => f.field !== field) }
      }
    }

    if (zone === 'values') {
      if ((next.values as ValueField[]).find(f => f.field === field)) return
      onChange({ ...next, values: [...next.values, { field, type, aggregation: 'sum' as AggregationType }] })
      return
    }

    if (zone === 'filters') {
      if ((next.filters as FilterField[]).find(f => f.field === field)) return
      const newFilter: FilterField = type !== 'number'
        ? {
            field, type,
            distinctValues: distinctValues[field] ?? collectDistinctStringValues(preview)[field] ?? [],
            selectedValues: [],
          }
        : { field, type, min: '', max: '' }
      onChange({ ...next, filters: [...next.filters, newFilter] })
      return
    }

    if ((next[zone] as PlacedField[]).find(f => f.field === field)) return
    onChange({ ...next, [zone]: [...(next[zone] as PlacedField[]), { field, type }] })
  }

  // Met à jour la granularité date d'un champ dans rows ou columns
  const updateDateGroup = (zone: 'rows' | 'columns', field: string, dateGroup: DateGrouping | undefined) => {
    onChange({
      ...value,
      [zone]: (value[zone] as PlacedField[]).map(f =>
        f.field === field ? { ...f, dateGroup } : f
      ),
    })
  }

  const onDragStart = (e: DragStartEvent) => {
    const { field, type } = e.active.data.current as { field: string; type: FieldType }
    setDragging({ field, type })
  }

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    if (!e.over) return
    const { field, type } = e.active.data.current as { field: string; type: FieldType }
    addToZone(e.over.id as ZoneId, field, type)
  }

  const handleCompute = () => {
    const config: PivotConfig = {
      rows:    value.rows.map(f => ({ field: f.field, dateGroup: f.dateGroup })),
      columns: value.columns.map(f => ({ field: f.field, dateGroup: f.dateGroup })),
      values:  value.values.map(f => ({ field: f.field, aggregation: (f as ValueField).aggregation })),
      filters: toPivotFilters(value.filters),
    }
    onCompute(config)
  }

  return {
    sensors,
    dragging,
    available,
    fieldTypes,
    canCompute: value.rows.length > 0 && value.values.length > 0,
    computing:  status === 'computing',
    removeFromZone,
    addToZone,
    updateDateGroup,
    onDragStart,
    onDragEnd,
    handleCompute,
  }
}
