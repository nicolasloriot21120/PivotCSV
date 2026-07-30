import type { FilterField } from '../../../../types'
import styles from './NumberFilterRange.module.css'

export type NumberFilterRangeProps = {
  min:      number | '' | undefined
  max:      number | '' | undefined
  onUpdate: (patch: Partial<FilterField>) => void
}

export function NumberFilterRange({ min, max, onUpdate }: NumberFilterRangeProps) {
  return (
    <div className={styles.row}>
      <div className={styles.field}>
        <label className={styles.label}>Min</label>
        <input
          type="number"
          value={min ?? ''}
          onChange={e => onUpdate({ min: e.target.value === '' ? '' : Number(e.target.value) })}
          placeholder="—"
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Max</label>
        <input
          type="number"
          value={max ?? ''}
          onChange={e => onUpdate({ max: e.target.value === '' ? '' : Number(e.target.value) })}
          placeholder="—"
          className={styles.input}
        />
      </div>
    </div>
  )
}
