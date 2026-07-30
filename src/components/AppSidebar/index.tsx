import { Sparkles }            from 'lucide-react'
import { Sidebar }             from '@/components/ui/Sidebar'
import { FileDropzone }        from '@/components/ui/FileDropzone'
import { ThemePicker }         from '@/components/ui/ThemePicker'
import type { ThemeOption }    from '@/components/ui/ThemePicker'
import { LoadingSpinner }      from '@/components/ui/LoadingSpinner'
import type { FileEntry }      from '@/types/app'
import { FileEntryRow }        from './components/fileEntryRow/FileEntryRow'
import { useSampleLoader }     from './hooks/useSampleLoader'
import styles                  from './styles.module.css'

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
  const { loading: sampleLoading, loadSample } = useSampleLoader({ onFiles, onFileSelect })

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
          <button
            onClick={loadSample}
            disabled={sampleLoading}
            className={styles.sampleButton}
          >
            {sampleLoading
              ? <LoadingSpinner size={13} />
              : <Sparkles size={13} />
            }
            {sampleLoading ? 'Chargement…' : 'Charger un exemple'}
          </button>
        </div>
      }
    >
      <div className={styles.list}>
        {fileEntries.length === 0 && (
          <p className={styles.empty}>Aucun fichier importé</p>
        )}
        {fileEntries.map(entry => (
          <FileEntryRow
            key={entry.id}
            entry={entry}
            onSelect={() => onFileSelect(entry.file)}
            onAddPivot={() => onAddPivot(entry.file)}
            onRemove={() => onRemoveFile(entry.file)}
          />
        ))}
      </div>
    </Sidebar>
  )
}
