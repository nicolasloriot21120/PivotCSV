import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type SidebarProps = {
  open:      boolean
  onToggle:  () => void
  width?:    number   // px, défaut 288
  header?:   ReactNode
  footer?:   ReactNode
  children:  ReactNode
}

export function Sidebar({ open, onToggle, width = 288, header, footer, children }: SidebarProps) {
  return (
    <aside
      style={{ width: open ? width : 0 }}
      className={[
        'relative flex flex-col flex-shrink-0 h-full',
        'bg-surface border-r border-border',
        'transition-[width] duration-300 ease-in-out overflow-hidden',
      ].join(' ')}
    >
      <button
        onClick={onToggle}
        style={{ right: open ? -14 : -14 }}
        className={[
          'absolute top-4 z-10',
          'w-7 h-7 rounded-full flex items-center justify-center',
          'bg-elevated border border-border text-muted',
          'hover:text-text hover:border-border-strong transition-all duration-150',
          'shadow-[var(--shadow-card)]',
        ].join(' ')}
        title={open ? 'Réduire' : 'Ouvrir'}
      >
        {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      <div className="flex flex-col h-full overflow-hidden" style={{ width }}>
        {header && (
          <div className="px-4 py-4 border-b border-border flex-shrink-0">
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
  )
}
