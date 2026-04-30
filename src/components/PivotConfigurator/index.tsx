import { useState } from 'react'
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { Rows3, Columns3, Hash, Play, Loader2 } from 'lucide-react'

import type { RawRow }          from '@/lib/loader/csv/types'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { AggregationType } from '@/lib/pivot/types'

import { FieldChip }  from './FieldChip'
import { DropZone }   from './DropZone'
import { ValueChip }  from './ValueChip'
import { FilterZone } from './FilterZone'
import type {
  ConfiguratorState, FieldType,
  FilterField, PlacedField, ValueField, ZoneId,
} from './types'
import { toPivotFilters } from './types'

type Props = {
  value:          ConfiguratorState
  onChange:       (s: ConfiguratorState) => void
  headers:        string[]
  preview:        RawRow[]
  distinctValues: Record<string, string[]>  // toutes valeurs distinctes (scan arrière-plan)
  status:         'idle' | 'computing' | 'done' | 'error'
  progress:       number
  onCompute:      (config: PivotConfig) => void
  onCancel:       () => void
}

function inferType(rows: RawRow[], field: string): FieldType {
  for (const row of rows) {
    const v = row[field]
    if (v !== null && v !== undefined && v !== '') {
      return typeof v === 'number' ? 'number' : 'string'
    }
  }
  return 'string'
}

function previewDistinctValues(rows: RawRow[], field: string): string[] {
  const seen = new Set<string>()
  for (const row of rows) seen.add(String(row[field] ?? ''))
  return [...seen].sort()
}

const EXCLUSIVE_ZONES: ZoneId[] = ['rows', 'columns', 'values']

export function PivotConfigurator({ value, onChange, headers, preview, distinctValues, status, progress, onCompute, onCancel }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 4 },
  }))

  const [dragging, setDragging] = useState<{ field: string; type: FieldType } | null>(null)

  const fieldTypes: Record<string, FieldType> = {}
  for (const h of headers) fieldTypes[h] = inferType(preview, h)

  const placedInExclusive = new Set(
    [...value.rows, ...value.columns, ...value.values].map(f => f.field)
  )

  const available = headers
    .filter(h => !placedInExclusive.has(h))
    .map(h => ({ field: h, type: fieldTypes[h] }))

  const removeFromZone = (zone: keyof ConfiguratorState, field: string) => {
    onChange({ ...value, [zone]: (value[zone] as PlacedField[]).filter(f => f.field !== field) })
  }

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
        ? { field, type, distinctValues: distinctValues[field] ?? previewDistinctValues(preview, field), selectedValues: [] }
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

  const canCompute = value.rows.length > 0 && value.values.length > 0
  const computing  = status === 'computing'

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-6">

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Champs disponibles
          </span>
          <div className="flex flex-wrap gap-1.5 p-3 rounded-[var(--radius-md)] bg-surface border border-border min-h-[52px]">
            {available.length === 0 && (
              <p className="text-subtle text-xs self-center">Tous les champs sont placés</p>
            )}
            {available.map(f => (
              <FieldChip
                key={f.field}
                field={f.field}
                type={f.type}
                draggableId={`available::${f.field}`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DropZone id="rows" label="Lignes" icon={<Rows3 size={12} />} placeholder="Glissez un champ ici">
            {value.rows.map(f => (
              <FieldChip
                key={f.field}
                field={f.field}
                type={f.type}
                draggableId={`rows::${f.field}`}
                onRemove={() => removeFromZone('rows', f.field)}
              />
            ))}
          </DropZone>

          <DropZone id="columns" label="Colonnes" icon={<Columns3 size={12} />} placeholder="Glissez un champ ici">
            {value.columns.map(f => (
              <FieldChip
                key={f.field}
                field={f.field}
                type={f.type}
                draggableId={`columns::${f.field}`}
                onRemove={() => removeFromZone('columns', f.field)}
              />
            ))}
          </DropZone>

          <DropZone id="values" label="Valeurs" icon={<Hash size={12} />} placeholder="Champs numériques">
            {value.values.map(f => (
              <ValueChip
                key={f.field}
                field={f}
                onRemove={() => removeFromZone('values', f.field)}
                onAggChange={agg =>
                  onChange({
                    ...value,
                    values: value.values.map(v => v.field === f.field ? { ...v, aggregation: agg } : v),
                  })
                }
              />
            ))}
          </DropZone>

          <FilterZone
            filters={value.filters}
            onRemove={field => removeFromZone('filters', field)}
            onUpdate={(field, patch) =>
              onChange({
                ...value,
                filters: value.filters.map(f => f.field === field ? { ...f, ...patch } : f),
              })
            }
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={computing ? onCancel : handleCompute}
            disabled={!canCompute && !computing}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)]',
              'text-sm font-semibold transition-all duration-150',
              computing
                ? 'bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20'
                : canCompute
                  ? 'bg-accent text-white hover:bg-accent-hi shadow-[var(--shadow-glow)]'
                  : 'bg-elevated border border-border text-subtle cursor-not-allowed',
            ].join(' ')}
          >
            {computing
              ? <><Loader2 size={14} className="animate-spin" /> Annuler</>
              : <><Play size={14} /> Calculer</>
            }
          </button>

          {computing && (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted tabular-nums">{progress}%</span>
            </div>
          )}

          {!canCompute && !computing && (
            <p className="text-xs text-subtle">Au moins une ligne et une valeur requises</p>
          )}
        </div>

      </div>

      <DragOverlay>
        {dragging && (
          <FieldChip
            field={dragging.field}
            type={dragging.type}
            draggableId="overlay"
            className="shadow-[var(--shadow-elevated)] opacity-90 rotate-1 scale-105"
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
