import { useState } from 'react'
import {
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import type { RawRow }          from '@/lib/loader'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { AggregationType } from '@/lib/pivot/types'
import { collectDistinctStringValues } from '@/lib/utils/records'
import type {
  ConfiguratorState, FieldType,
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
      return typeof v === 'number' ? 'number' : 'string'
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
      const newFilter: FilterField = type === 'string'
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
      rows:    value.rows.map(f => f.field),
      columns: value.columns.map(f => f.field),
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
    onDragStart,
    onDragEnd,
    handleCompute,
  }
}
