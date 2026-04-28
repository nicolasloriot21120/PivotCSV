import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS }                        from '@dnd-kit/utilities'
import { GripVertical, X, Filter }    from 'lucide-react'
import type { FilterField }           from './types'

type FilterItemProps = {
  f:        FilterField
  onRemove: () => void
  onUpdate: (patch: Partial<FilterField>) => void
}

function FilterItem({ f, onRemove, onUpdate }: FilterItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `filters::${f.field}`,
    data: { field: f.field, type: f.type },
  })

  const style = { transform: CSS.Translate.toString(transform) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'bg-elevated border border-border rounded-[var(--radius-md)] px-2.5 py-2 flex flex-col gap-2',
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
        <span className={[
          'text-xs font-medium truncate flex-1',
          f.type === 'number' ? 'text-accent-hi' : 'text-text',
        ].join(' ')}>
          {f.field}
          {f.type === 'number' && <span className="text-accent/60 font-mono ml-1">#</span>}
        </span>
        <button
          onClick={onRemove}
          className="text-subtle hover:text-danger transition-colors flex-shrink-0"
        >
          <X size={11} />
        </button>
      </div>

      {f.type === 'string' ? (
        <div className="flex flex-wrap gap-1 pl-4">
          {(f.distinctValues ?? []).map(v => {
            const selected = f.selectedValues?.includes(v) ?? false
            return (
              <button
                key={v}
                onClick={() => {
                  const current = f.selectedValues ?? []
                  onUpdate({ selectedValues: selected ? current.filter(x => x !== v) : [...current, v] })
                }}
                className={[
                  'px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-100',
                  selected
                    ? 'bg-accent text-white'
                    : 'bg-border text-muted hover:bg-border-strong hover:text-text',
                ].join(' ')}
              >
                {v}
              </button>
            )
          })}
          {(f.distinctValues?.length ?? 0) === 0 && (
            <span className="text-subtle text-[11px]">Chargement des valeurs…</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 pl-4">
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-[10px] text-subtle">Min</label>
            <input
              type="number"
              value={f.min ?? ''}
              onChange={e => onUpdate({ min: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="—"
              className={[
                'w-full bg-surface border border-border rounded-[var(--radius-sm)]',
                'px-2 py-1 text-xs text-text placeholder:text-subtle',
                'focus:outline-none focus:border-accent/50 transition-colors',
              ].join(' ')}
            />
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-[10px] text-subtle">Max</label>
            <input
              type="number"
              value={f.max ?? ''}
              onChange={e => onUpdate({ max: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="—"
              className={[
                'w-full bg-surface border border-border rounded-[var(--radius-sm)]',
                'px-2 py-1 text-xs text-text placeholder:text-subtle',
                'focus:outline-none focus:border-accent/50 transition-colors',
              ].join(' ')}
            />
          </div>
        </div>
      )}
    </div>
  )
}

type Props = {
  filters:  FilterField[]
  onRemove: (field: string) => void
  onUpdate: (field: string, patch: Partial<FilterField>) => void
}

export function FilterZone({ filters, onRemove, onUpdate }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'filters' })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Filter size={12} className="text-accent/70" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Filtres</span>
        <span className="text-[10px] text-subtle ml-1">(appliqués avant agrégation)</span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          'rounded-[var(--radius-md)] border-2 border-dashed',
          'p-2 flex flex-col gap-2 transition-all duration-150',
          filters.length === 0 ? 'min-h-[64px]' : '',
          isOver
            ? 'border-accent/60 bg-accent/5'
            : 'border-border hover:border-border-strong',
        ].join(' ')}
      >
        {filters.length === 0 && (
          <p className="text-subtle text-xs self-center w-full text-center py-1">
            Glissez un champ ici pour filtrer
          </p>
        )}
        {filters.map(f => (
          <FilterItem
            key={f.field}
            f={f}
            onRemove={() => onRemove(f.field)}
            onUpdate={patch => onUpdate(f.field, patch)}
          />
        ))}
      </div>
    </div>
  )
}
