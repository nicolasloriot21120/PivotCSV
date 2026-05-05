import { useDraggable }        from '@dnd-kit/core'
import { CSS }                 from '@dnd-kit/utilities'
import { GripVertical, X }     from 'lucide-react'
import type { AggregationType } from '@/lib/pivot/types.ts'
import type { ValueField }      from '../../types'
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `values::${field.field}`,
    data: { field: field.field, type: field.type },
  })

  const style = { transform: CSS.Translate.toString(transform) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? styles.chipDragging : styles.chip}
    >
      <div className={styles.header}>
        <span
          {...attributes}
          {...listeners}
          className={styles.dragHandle}
        >
          <GripVertical size={12} />
        </span>
        <span className={styles.fieldName}>{field.field}</span>
        <button
          onClick={onRemove}
          className={styles.removeButton}
        >
          <X size={11} />
        </button>
      </div>
      <div className={styles.aggBar}>
        {AGGS.map(a => (
          <button
            key={a.id}
            onClick={() => onAggChange(a.id)}
            title={a.title}
            className={field.aggregation === a.id ? styles.aggButtonActive : styles.aggButtonIdle}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
