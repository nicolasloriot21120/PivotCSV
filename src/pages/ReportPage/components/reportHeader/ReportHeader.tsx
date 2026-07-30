import { LayoutGrid, Presentation } from 'lucide-react'
import shared from '@/styles/shared.module.css'
import styles from './ReportHeader.module.css'

export type ReportHeaderProps = {
  sectionsCount:       number
  canPresent:          boolean
  onOpenPresentation:  () => void
}

export function ReportHeader({ sectionsCount, canPresent, onOpenPresentation }: ReportHeaderProps) {
  return (
    <header className={`${shared.onAccent} ${styles.header}`}>
      <div className={styles.headerLeft}>
        <LayoutGrid size={14} />
        <span className={styles.sectionsCount}>
          {sectionsCount === 0
            ? 'Aucune section — ajoutez un pivot depuis la sidebar'
            : `${sectionsCount} section${sectionsCount > 1 ? 's' : ''}`
          }
        </span>
      </div>
      <div className={styles.headerActions}>
        {canPresent && (
          <button
            onClick={onOpenPresentation}
            className={styles.actionButton}
            title="Mode présentation"
          >
            <Presentation size={13} />
            Présentation
          </button>
        )}
      </div>
    </header>
  )
}
