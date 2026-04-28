import { useDraggable }    from '@dnd-kit/core'
import { CSS }             from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import type { FieldType }  from './types'

type Props = {
  field:     string
  type:      FieldType
  draggableId: string
  onRemove?: () => void
  className?: string
}

export function FieldChip({ field, type, draggableId, onRemove, className = '' }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   draggableId,
    data: { field, type },
  })

  const style = { transform: CSS.Translate.toString(transform) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-1.5 px-2.5 py-1.5',
        'rounded-[var(--radius-md)] border text-xs font-medium',
        'select-none transition-all duration-150',
        isDragging
          ? 'opacity-40'
          : 'bg-elevated border-border hover:border-border-strong',
        className,
      ].join(' ')}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-subtle hover:text-muted cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={12} />
      </span>

      <span className={[
        'truncate max-w-[120px]',
        type === 'number' ? 'text-accent-hi' : 'text-text',
      ].join(' ')}>
        {field}
      </span>

      {type === 'number' && (
        <span className="text-accent/60 text-[10px] font-mono">#</span>
      )}

      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="text-subtle hover:text-danger transition-colors flex-shrink-0 ml-0.5"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}
