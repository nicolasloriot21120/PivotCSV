import { useDraggable }    from '@dnd-kit/core'
import { CSS }             from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import type { ReactNode }  from 'react'
import type { FieldType }  from '../../types'
import styles              from './FieldChip.module.css'

type Props = {
  field:           string
  type:            FieldType
  draggableId:     string
  onRemove?:       () => void
  showNumberHash?: boolean
  children?:       ReactNode
}

export function FieldChip({
  field,
  type,
  draggableId,
  onRemove,
  showNumberHash = true,
  children,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   draggableId,
    data: { field, type },
  })

  const style = { transform: CSS.Translate.toString(transform) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging || undefined}
      className={styles.chip}
    >
      <div className={styles.header}>
        <span
          {...attributes}
          {...listeners}
          className={styles.dragHandle}
        >
          <GripVertical size={12} />
        </span>

        <span data-type={type} className={styles.label}>
          {field}
        </span>

        {showNumberHash && type === 'number' && (
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

      {children}
    </div>
  )
}
