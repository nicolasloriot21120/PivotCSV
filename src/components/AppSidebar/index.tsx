import { FileText, Plus, X }  from 'lucide-react'
import { Sidebar }            from '@/components/ui/Sidebar'
import { FileDropzone }       from '@/components/ui/FileDropzone'
import { ThemePicker }        from '@/components/ui/ThemePicker'
import type { ThemeOption }   from '@/components/ui/ThemePicker'
import type { FileEntry }     from '@/types/app'

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
        <div className="flex items-center justify-between w-full">
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-bold text-text">PivotCSV</h1>
            <span className="text-[11px] text-subtle">Analyse CSV</span>
          </div>
          <ThemePicker themes={themes} value={theme} onChange={onThemeChange} />
        </div>
      }
      footer={
        <div className="px-3 py-3">
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
      <div className="px-3 py-3 flex flex-col gap-1">
        {fileEntries.length === 0 && (
          <p className="text-subtle text-xs text-center py-4">Aucun fichier importé</p>
        )}
        {fileEntries.map(entry => (
          <div
            key={entry.id}
            onClick={() => onFileSelect(entry.file)}
            className={[
              'flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-md)]',
              'cursor-pointer transition-all duration-150 group',
              'hover:bg-elevated',
            ].join(' ')}
          >
            <FileText size={13} className="text-accent flex-shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-text truncate">{entry.file.name}</span>
              <span className="text-[10px] text-subtle">
                {entry.rowCount === null ? '…' : entry.rowCount.toLocaleString('fr-FR')} lignes
                {entry.pivotCount > 0 && ` · ${entry.pivotCount} pivot${entry.pivotCount > 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
              <button
                onClick={e => { e.stopPropagation(); onAddPivot(entry.file) }}
                className="w-5 h-5 rounded flex items-center justify-center text-subtle hover:text-accent hover:bg-accent/10 transition-all duration-150"
                title="Nouveau pivot"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemoveFile(entry.file) }}
                className="w-5 h-5 rounded flex items-center justify-center text-subtle hover:text-danger hover:bg-danger/10 transition-all duration-150"
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
