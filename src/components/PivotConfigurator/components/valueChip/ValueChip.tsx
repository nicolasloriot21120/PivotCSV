import type { AggregationType } from '@/lib/pivot/types.ts'
import type { ValueField }      from '../../types'
import { FieldChip }            from '../fieldChip/FieldChip'
import styles                   from './ValueChip.module.css'

const AGGS: { id: AggregationType; label: string; title: string }[] = [
  { id: 'sum',   label: 'Σ', title: 'Somme'   },
  { id: 'count', label: '#', title: 'Nombre'  },
  { id: 'avg',   label: 'Ø', title: 'Moyenne' },
  { id: 'min',   label: '▼', title: 'Minimum' },
  { id: 'max',   label: '▲', title: 'Maximum' },
]

type Props = {
  field:       ValueField
  onRemove:    () => void
  onAggChange: (agg: AggregationType) => void
}

export function ValueChip({ field, onRemove, onAggChange }: Props) {
  return (
    <FieldChip
      field={field.field}
      type={field.type}
      draggableId={`values::${field.field}`}
      onRemove={onRemove}
      showNumberHash={false}
    >
      <div className={styles.aggBar}>
        {AGGS.map(a => (
          <button
            key={a.id}
            onClick={() => onAggChange(a.id)}
            title={a.title}
            data-active={field.aggregation === a.id || undefined}
            className={styles.aggButton}
          >
            {a.label}
          </button>
        ))}
      </div>
    </FieldChip>
  )
}
