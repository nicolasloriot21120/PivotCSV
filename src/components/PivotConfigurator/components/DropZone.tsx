import { useDroppable }          from '@dnd-kit/core'
import type { ReactNode }        from 'react'
import type { ZoneId }           from '../types'

type Props = {
  id:          ZoneId
  label:       string
  icon:        ReactNode
  children:    ReactNode
  isOver?:     boolean
  placeholder: string
}

export function DropZone({ id, label, icon, children, placeholder }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-accent/70">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          'min-h-[64px] rounded-[var(--radius-md)] border-2 border-dashed',
          'p-2 flex flex-wrap gap-1.5 transition-all duration-150',
          isOver
            ? 'border-accent/60 bg-accent/5'
            : 'border-border hover:border-border-strong',
        ].join(' ')}
      >
        {children ?? (
          <p className="text-subtle text-xs self-center w-full text-center py-1">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  )
}
