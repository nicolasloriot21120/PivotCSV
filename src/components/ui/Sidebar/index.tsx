import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './styles.module.css'

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
    <div className={styles.root}>

      {/* Bouton toggle — en dehors de l'aside pour ne pas être masqué par overflow-hidden */}
      <button
        onClick={onToggle}
        className={styles.toggleButton}
        style={{ left: open ? width - 14 : 10 }}
        title={open ? 'Réduire' : 'Ouvrir'}
      >
        {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      <aside
        style={{ width: open ? width : 0 }}
        className={styles.aside}
      >
        <div className={styles.inner} style={{ width }}>
          {header && (
            <div className={styles.header}>
              {header}
            </div>
          )}

          <div className={styles.body}>
            {children}
          </div>

          {footer && (
            <div className={styles.footer}>
              {footer}
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}
