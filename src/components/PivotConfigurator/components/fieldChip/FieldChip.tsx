import { useDraggable }    from '@dnd-kit/core'
import { CSS }             from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import type { FieldType }  from '../../types'
import styles              from './FieldChip.module.css'

type Props = {
  field:     string
  type:      FieldType
  draggableId: string
  onRemove?: () => void
  className?: string
}

export function FieldChip({ field, type, draggableId, onRemove, className }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   draggableId,
    data: { field, type },
  })

  const style = { transform: CSS.Translate.toString(transform) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[isDragging ? styles.chipDragging : styles.chip, className].filter(Boolean).join(' ')}
    >
      <span
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
      >
        <GripVertical size={12} />
      </span>

      <span className={type === 'number' ? styles.labelNumber : styles.labelString}>
        {field}
      </span>

      {type === 'number' && (
        <span className={styles.numberHash}>#</span>
      )}

      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className={styles.removeButton}
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}
