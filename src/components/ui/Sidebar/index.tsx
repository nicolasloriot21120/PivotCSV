import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type SidebarProps = {
  open:      boolean
  onToggle:  () => void
  width?:    number
  header?:   ReactNode
  footer?:   ReactNode
  children:  ReactNode
}

export function Sidebar({ open, onToggle, width = 288, header, footer, children }: SidebarProps) {
  return (
    <div className="relative flex-shrink-0 h-full">

      {/* Bouton toggle — en dehors de l'aside pour ne pas être masqué par overflow-hidden */}
      <button
        onClick={onToggle}
        className={[
          'absolute top-1/2 -translate-y-1/2 z-20',
          'w-7 h-7 rounded-full flex items-center justify-center',
          'bg-elevated border border-border text-muted',
          'hover:text-text hover:border-border-strong transition-all duration-150',
          'shadow-[var(--shadow-card)]',
        ].join(' ')}
        style={{ left: open ? width - 14 : 10 }}
        title={open ? 'Réduire' : 'Ouvrir'}
      >
        {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      <aside
        style={{ width: open ? width : 0 }}
        className={[
          'flex flex-col h-full',
          'bg-surface border-r border-border',
          'transition-[width] duration-300 ease-in-out overflow-hidden',
        ].join(' ')}
      >
        <div className="flex flex-col h-full" style={{ width }}>
          {header && (
            <div className="px-4 h-12 flex items-center border-b border-border flex-shrink-0">
              {header}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

          {footer && (
            <div className="border-t border-border flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}
