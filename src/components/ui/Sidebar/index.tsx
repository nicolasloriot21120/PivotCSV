import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { FileDropzone } from '@/components/ui/FileDropzone'
import type { FileEntry } from '@/types/app'

type Props = {
  open:           boolean
  onToggle:       () => void
  fileEntries:    FileEntry[]
  onFiles:        (files: File[]) => void
  onFileSelect:   (file: File) => void
  onAddPivot:     (file: File) => void
}

export function Sidebar({ open, onToggle, fileEntries, onFiles, onFileSelect, onAddPivot }: Props) {
  return (
    <aside
      className={[
        'relative flex flex-col flex-shrink-0 h-full',
        'bg-surface border-r border-border',
        'transition-[width] duration-300 ease-in-out overflow-hidden',
        open ? 'w-72' : 'w-0',
      ].join(' ')}
    >
      {/* Toggle button — toujours visible, positionné sur le bord */}
      <button
        onClick={onToggle}
        className={[
          'absolute top-4 -right-3.5 z-10',
          'w-7 h-7 rounded-full flex items-center justify-center',
          'bg-elevated border border-border text-muted',
          'hover:text-text hover:border-border-strong transition-all duration-150',
          'shadow-[var(--shadow-card)]',
        ].join(' ')}
        title={open ? 'Réduire' : 'Ouvrir'}
      >
        {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      <div className="flex flex-col h-full w-72 overflow-hidden">

        {/* Header */}
        <div className="px-4 py-4 border-b border-border flex-shrink-0">
          <h1 className="text-base font-bold text-text">PivotCSV</h1>
          <p className="text-[11px] text-subtle mt-0.5">Analyse de données CSV</p>
        </div>

        {/* Liste de fichiers */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {fileEntries.length === 0 && (
            <p className="text-subtle text-xs text-center py-4">Aucun fichier importé</p>
          )}
          {fileEntries.map(entry => (
            <div key={entry.id} className="flex flex-col gap-0.5">
              <div
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
                <button
                  onClick={e => { e.stopPropagation(); onAddPivot(entry.file) }}
                  className={[
                    'flex-shrink-0 w-5 h-5 rounded flex items-center justify-center',
                    'text-subtle hover:text-accent hover:bg-accent/10 transition-all duration-150',
                    'opacity-0 group-hover:opacity-100',
                  ].join(' ')}
                  title="Nouveau pivot"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dropzone en bas */}
        <div className="px-3 pb-4 pt-2 border-t border-border flex-shrink-0">
          <FileDropzone
            accept=".csv"
            multiple
            onFiles={onFiles}
            onFileSelect={onFileSelect}
            label="Importer un CSV"
          />
        </div>

      </div>
    </aside>
  )
}
