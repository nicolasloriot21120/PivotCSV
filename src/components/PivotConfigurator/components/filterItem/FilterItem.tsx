import type { FilterField } from '../../types'
import { FieldChip }        from '../fieldChip/FieldChip'
import styles               from './FilterItem.module.css'

type Props = {
  field:    FilterField
  onRemove: () => void
  onUpdate: (patch: Partial<FilterField>) => void
}

export function FilterItem({ field, onRemove, onUpdate }: Props) {
  return (
    <FieldChip
      field={field.field}
      type={field.type}
      draggableId={`filters::${field.field}`}
      onRemove={onRemove}
    >
      {field.type === 'string' ? (
        <div className={styles.valueChips}>
          {(field.distinctValues ?? []).map(v => {
            const selected = field.selectedValues?.includes(v) ?? false
            return (
              <button
                key={v}
                onClick={() => {
                  const current = field.selectedValues ?? []
                  onUpdate({ selectedValues: selected ? current.filter(x => x !== v) : [...current, v] })
                }}
                className={selected ? styles.valueChipSelected : styles.valueChipIdle}
              >
                {v}
              </button>
            )
          })}
          {(field.distinctValues?.length ?? 0) === 0 && (
            <span className={styles.valuesLoading}>Chargement des valeurs…</span>
          )}
        </div>
      ) : (
        <div className={styles.rangeRow}>
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Min</label>
            <input
              type="number"
              value={field.min ?? ''}
              onChange={e => onUpdate({ min: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="—"
              className={styles.rangeInput}
            />
          </div>
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Max</label>
            <input
              type="number"
              value={field.max ?? ''}
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
