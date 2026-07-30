import type { FilterField } from '../../../../types'
import styles from './StringFilterValues.module.css'

export type StringFilterValuesProps = {
  distinctValues:  string[]
  selectedValues:  string[]
  onUpdate:        (patch: Partial<FilterField>) => void
}

export function StringFilterValues({ distinctValues, selectedValues, onUpdate }: StringFilterValuesProps) {
  if (distinctValues.length === 0) {
    return <span className={styles.loading}>Chargement des valeurs…</span>
  }

  return (
    <div className={styles.chips}>
      {distinctValues.map(v => {
        const selected = selectedValues.includes(v)
        return (
          <button
            key={v}
            onClick={() => {
              const next = selected
                ? selectedValues.filter(x => x !== v)
                : [...selectedValues, v]
              onUpdate({ selectedValues: next })
            }}
            data-active={selected || undefined}
            className={styles.chip}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}
