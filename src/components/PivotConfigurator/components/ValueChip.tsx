import { useDraggable }        from '@dnd-kit/core'
import { CSS }                 from '@dnd-kit/utilities'
import { GripVertical, X }     from 'lucide-react'
import type { AggregationType } from '@/lib/pivot/types'
import type { ValueField }      from '../types'

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
      className={[
        'flex flex-col gap-1 bg-elevated border border-border rounded-[var(--radius-md)] px-2.5 py-1.5',
        'transition-opacity duration-150',
        isDragging ? 'opacity-40' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <span
          {...attributes}
          {...listeners}
          className="text-subtle hover:text-muted cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        >
          <GripVertical size={12} />
        </span>
        <span className="text-xs font-medium text-accent-hi truncate max-w-[100px]">{field.field}</span>
        <button
          onClick={onRemove}
          className="text-subtle hover:text-danger transition-colors ml-auto flex-shrink-0"
        >
          <X size={11} />
        </button>
      </div>
      <div className="flex gap-0.5 pl-4">
        {AGGS.map(a => (
          <button
            key={a.id}
            onClick={() => onAggChange(a.id)}
            title={a.title}
            className={[
              'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-100',
              field.aggregation === a.id
                ? 'bg-accent text-white'
                : 'text-subtle hover:text-text hover:bg-border',
            ].join(' ')}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
