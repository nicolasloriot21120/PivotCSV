import { FileText, Plus, X } from 'lucide-react'
import type { FileEntry } from '@/types/app'
import styles from './FileEntryRow.module.css'

export type FileEntryRowProps = {
  entry:       FileEntry
  onSelect:    () => void
  onAddPivot:  () => void
  onRemove:    () => void
}

export function FileEntryRow({ entry, onSelect, onAddPivot, onRemove }: FileEntryRowProps) {
  return (
    <div onClick={onSelect} className={styles.row}>
      <FileText size={13} className={styles.fileIcon} />
      <div className={styles.rowText}>
        <span className={styles.fileName}>{entry.file.name}</span>
        <span className={styles.meta}>
          {entry.rowCount === null ? '…' : entry.rowCount.toLocaleString('fr-FR')} lignes
          {entry.pivotCount > 0 && ` · ${entry.pivotCount} pivot${entry.pivotCount > 1 ? 's' : ''}`}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          onClick={e => { e.stopPropagation(); onAddPivot() }}
          className={styles.actionButtonAdd}
          title="Nouveau pivot"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className={styles.actionButtonRemove}
          title="Retirer le fichier"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
