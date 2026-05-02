import {
  DndContext, DragOverlay,
} from '@dnd-kit/core'
import { Rows3, Columns3, Hash, Play, Loader2 } from 'lucide-react'

import type { RawRow }      from '@/lib/loader'
import type { PivotConfig } from '@/lib/pivot/types'

import { FieldChip }       from './components/FieldChip'
import { DropZone }        from './components/DropZone'
import { ValueChip }       from './components/ValueChip'
import { FilterZone }      from './components/FilterZone'
import { DateGroupPicker } from './components/DateGroupPicker'
import type { ConfiguratorState } from './types'
import { usePivotConfigurator } from './hooks/usePivotConfigurator'
import styles from './styles.module.css'

type Props = {
  value:          ConfiguratorState
  onChange:       (s: ConfiguratorState) => void
  headers:        string[]
  preview:        RawRow[]
  distinctValues: Record<string, string[]>
  status:         'idle' | 'computing' | 'done' | 'error'
  progress:       number
  onCompute:      (config: PivotConfig) => void
  onCancel:       () => void
}

export function PivotConfigurator({ value, onChange, headers, preview, distinctValues, status, progress, onCompute, onCancel }: Props) {
  const {
    sensors, dragging, available,
    canCompute, computing,
    removeFromZone, updateDateGroup,
    onDragStart, onDragEnd, handleCompute,
  } = usePivotConfigurator({ value, onChange, headers, preview, distinctValues, status, onCompute })

  const computeButtonClass = computing
    ? styles.computeButtonComputing
    : canCompute
      ? styles.computeButtonReady
      : styles.computeButtonDisabled

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={styles.root}>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            Champs disponibles
          </span>
          <div className={styles.availableArea}>
            {available.length === 0 && (
              <p className={styles.availableEmpty}>Tous les champs sont placés</p>
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

        <div className={styles.zonesGrid}>
          <DropZone id="rows" label="Lignes" icon={<Rows3 size={12} />} placeholder="Glissez un champ ici">
            {value.rows.map(f => (
              <div key={f.field} className={styles.zoneItem}>
                <FieldChip
                  field={f.field}
                  type={f.type}
                  draggableId={`rows::${f.field}`}
                  onRemove={() => removeFromZone('rows', f.field)}
                />
                {f.type === 'date' && (
                  <DateGroupPicker
                    value={f.dateGroup}
                    onChange={g => updateDateGroup('rows', f.field, g)}
                  />
                )}
              </div>
            ))}
          </DropZone>

          <DropZone id="columns" label="Colonnes" icon={<Columns3 size={12} />} placeholder="Glissez un champ ici">
            {value.columns.map(f => (
              <div key={f.field} className={styles.zoneItem}>
                <FieldChip
                  field={f.field}
                  type={f.type}
                  draggableId={`columns::${f.field}`}
                  onRemove={() => removeFromZone('columns', f.field)}
                />
                {f.type === 'date' && (
                  <DateGroupPicker
                    value={f.dateGroup}
                    onChange={g => updateDateGroup('columns', f.field, g)}
                  />
                )}
              </div>
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

        <div className={styles.actions}>
          <button
            onClick={computing ? onCancel : handleCompute}
            disabled={!canCompute && !computing}
            className={computeButtonClass}
          >
            {computing
              ? <><Loader2 size={14} className="animate-spin" /> Annuler</>
              : <><Play size={14} /> Calculer</>
            }
          </button>

          {computing && (
            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={styles.progressLabel}>{progress}%</span>
            </div>
          )}

          {!canCompute && !computing && (
            <p className={styles.requirementHint}>Au moins une ligne et une valeur requises</p>
          )}
        </div>

      </div>

      <DragOverlay>
        {dragging && (
          <FieldChip
            field={dragging.field}
            type={dragging.type}
            draggableId="overlay"
            className={styles.dragOverlayChip}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
