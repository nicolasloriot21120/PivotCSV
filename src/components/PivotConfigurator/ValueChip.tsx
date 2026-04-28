import { X }                  from 'lucide-react'
import type { AggregationType } from '@/lib/pivot/types'
import type { ValueField }      from './types'

const AGGS: { id: AggregationType; label: string }[] = [
  { id: 'sum',   label: 'Σ'   },
  { id: 'count', label: '#'   },
  { id: 'avg',   label: 'Ø'   },
  { id: 'min',   label: '▼'   },
  { id: 'max',   label: '▲'   },
]

type Props = {
  field:       ValueField
  onRemove:    () => void
  onAggChange: (agg: AggregationType) => void
}

export function ValueChip({ field, onRemove, onAggChange }: Props) {
  return (
    <div className="flex flex-col gap-1 bg-elevated border border-border rounded-[var(--radius-md)] px-2.5 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-accent-hi truncate max-w-[100px]">{field.field}</span>
        <button
          onClick={onRemove}
          className="text-subtle hover:text-danger transition-colors ml-auto flex-shrink-0"
        >
          <X size={11} />
        </button>
      </div>
      <div className="flex gap-0.5">
        {AGGS.map(a => (
          <button
            key={a.id}
            onClick={() => onAggChange(a.id)}
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
