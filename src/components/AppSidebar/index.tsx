import { FileText, Plus, X }  from 'lucide-react'
import { Sidebar }            from '@/components/ui/Sidebar'
import { FileDropzone }       from '@/components/ui/FileDropzone'
import { ThemePicker }        from '@/components/ui/ThemePicker'
import type { ThemeOption }   from '@/components/ui/ThemePicker'
import type { FileEntry }     from '@/types/app'
import styles                 from './styles.module.css'

type Props<T extends string = string> = {
  open:           boolean
  onToggle:       () => void
  fileEntries:    FileEntry[]
  onFiles:        (files: File[]) => void
  onFileSelect:   (file: File) => void
  onAddPivot:     (file: File) => void
  onRemoveFile:   (file: File) => void
  themes:         ThemeOption<T>[]
  theme:          T
  onThemeChange:  (id: T) => void
}

export function AppSidebar<T extends string>({ open, onToggle, fileEntries, onFiles, onFileSelect, onAddPivot, onRemoveFile, themes, theme, onThemeChange }: Props<T>) {
  return (
    <Sidebar
      open={open}
      onToggle={onToggle}
      header={
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>PivotCSV</h1>
            <span className={styles.subtitle}>Analyse CSV</span>
          </div>
          <ThemePicker themes={themes} value={theme} onChange={onThemeChange} />
        </div>
      }
      footer={
        <div className={styles.footer}>
          <FileDropzone
            accept=".csv"
            multiple
            onFiles={onFiles}
            onFileSelect={onFileSelect}
            label="Importer un CSV"
            hideList
          />
        </div>
      }
    >
      <div className={styles.list}>
        {fileEntries.length === 0 && (
          <p className={styles.empty}>Aucun fichier importé</p>
        )}
        {fileEntries.map(entry => (
          <div
            key={entry.id}
            onClick={() => onFileSelect(entry.file)}
            className={styles.row}
          >
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
                onClick={e => { e.stopPropagation(); onAddPivot(entry.file) }}
                className={styles.actionButtonAdd}
                title="Nouveau pivot"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemoveFile(entry.file) }}
                className={styles.actionButtonRemove}
                title="Retirer le fichier"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Sidebar>
  )
}
