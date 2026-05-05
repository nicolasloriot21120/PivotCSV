import { useDroppable } from '@dnd-kit/core'
import { Filter }       from 'lucide-react'
import type { FilterField } from '../../types'
import { FieldChip }        from '../fieldChip/FieldChip'
import styles               from './FilterZone.module.css'

type FilterItemProps = {
  f:        FilterField
  onRemove: () => void
  onUpdate: (patch: Partial<FilterField>) => void
}

function FilterItem({ f, onRemove, onUpdate }: FilterItemProps) {
  return (
    <FieldChip
      field={f.field}
      type={f.type}
      draggableId={`filters::${f.field}`}
      onRemove={onRemove}
    >
      {f.type === 'string' ? (
        <div className={styles.valueChips}>
          {(f.distinctValues ?? []).map(v => {
            const selected = f.selectedValues?.includes(v) ?? false
            return (
              <button
                key={v}
                onClick={() => {
                  const current = f.selectedValues ?? []
                  onUpdate({ selectedValues: selected ? current.filter(x => x !== v) : [...current, v] })
                }}
                className={selected ? styles.valueChipSelected : styles.valueChipIdle}
              >
                {v}
              </button>
            )
          })}
          {(f.distinctValues?.length ?? 0) === 0 && (
            <span className={styles.valuesLoading}>Chargement des valeurs…</span>
          )}
        </div>
      ) : (
        <div className={styles.rangeRow}>
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Min</label>
            <input
              type="number"
              value={f.min ?? ''}
              onChange={e => onUpdate({ min: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="—"
              className={styles.rangeInput}
            />
          </div>
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Max</label>
            <input
              type="number"
              value={f.max ?? ''}
              onChange={e => onUpdate({ max: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="—"
              className={styles.rangeInput}
            />
          </div>
        </div>
      )}
    </FieldChip>
  )
}

type Props = {
  filters:  FilterField[]
  onRemove: (field: string) => void
  onUpdate: (field: string, patch: Partial<FilterField>) => void
}

export function FilterZone({ filters, onRemove, onUpdate }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'filters' })

  const isEmpty = filters.length === 0
  const areaClass = isOver
    ? (isEmpty ? styles.areaActiveEmpty : styles.areaActive)
    : (isEmpty ? styles.areaIdleEmpty   : styles.areaIdle)

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <Filter size={12} className={styles.icon} />
        <span className={styles.label}>Filtres</span>
        <span className={styles.hint}>(appliqués avant agrégation)</span>
      </div>

      <div ref={setNodeRef} className={areaClass}>
        {isEmpty && (
          <p className={styles.placeholder}>
            Glissez un champ ici pour filtrer
          </p>
        )}
        {filters.map(f => (
          <FilterItem
            key={f.field}
            f={f}
            onRemove={() => onRemove(f.field)}
            onUpdate={patch => onUpdate(f.field, patch)}
          />
        ))}
      </div>
    </div>
  )
}
