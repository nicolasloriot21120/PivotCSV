import { LayoutGrid } from 'lucide-react'
import styles from './EmptyState.module.css'

export function EmptyState() {
  return (
    <div className={styles.root}>
      <LayoutGrid size={32} className={styles.icon} />
      <p className={styles.title}>Aucune section</p>
      <p className={styles.description}>
        Importez un fichier CSV dans la sidebar puis cliquez sur&nbsp;
        <span className={styles.highlight}>+</span> pour créer votre premier pivot.
      </p>
    </div>
  )
}
