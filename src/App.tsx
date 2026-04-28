import { useRef, useState }      from 'react'
import { Plus, Upload, Trash2, ChevronRight, ChevronsUpDown, X } from 'lucide-react'
import { Button }                from '@/components/ui/Button'
import { Card }                  from '@/components/ui/Card'
import { Badge }                 from '@/components/ui/Badge'
import { FileDropzone }          from '@/components/ui/FileDropzone'
import { ThemePicker }           from '@/components/ui/ThemePicker'
import { PivotConfigurator }     from '@/components/PivotConfigurator'
import { emptyConfiguratorState } from '@/components/PivotConfigurator/types'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'
import { CSVLoader }             from '@/lib/loader'
import type { RawRow, ParseError } from '@/lib/loader'
import type { PivotConfig, PivotData } from '@/lib/pivot/types'
import type { WorkerResponse }   from '@/lib/pivot/worker'

const loader = new CSVLoader()

// ── Types ────────────────────────────────────────────────────────────────────

type PivotInstance = {
  id:                 string
  label:              string
  configuratorState:  ConfiguratorState
  result:             PivotData | null
  errors:             ParseError[]
  status:             'idle' | 'computing' | 'done' | 'error'
  progress:           number
}

type FileEntry = {
  id:           string
  file:         File
  headers:      string[]
  preview:      RawRow[]
  parseErrors:  ParseError[]
  rowCount:     number | null
  pivots:       PivotInstance[]
  activePivotId: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFileEntry(file: File): FileEntry {
  return {
    id: crypto.randomUUID(),
    file,
    headers: [],
    preview: [],
    parseErrors: [],
    rowCount: null,
    pivots: [],
    activePivotId: null,
  }
}

function makePivot(index: number): PivotInstance {
  return {
    id:                crypto.randomUUID(),
    label:             `Pivot ${index}`,
    configuratorState: emptyConfiguratorState(),
    result:            null,
    errors:            [],
    status:            'idle',
    progress:          0,
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [fileEntries,    setFileEntries]    = useState<FileEntry[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [previewOpen,    setPreviewOpen]    = useState(false)

  const workerRef      = useRef<Worker | null>(null)
  const computingRef   = useRef<{ fileId: string; pivotId: string } | null>(null)

  // ── File helpers ─────────────────────────────────────────────────────────

  const updateFile = (fileId: string, patch: Partial<FileEntry>) =>
    setFileEntries(fs => fs.map(f => f.id === fileId ? { ...f, ...patch } : f))

  const updatePivot = (fileId: string, pivotId: string, patch: Partial<PivotInstance>) =>
    setFileEntries(fs => fs.map(f =>
      f.id !== fileId ? f : {
        ...f,
        pivots: f.pivots.map(p => p.id === pivotId ? { ...p, ...patch } : p),
      }
    ))

  const loadPreview = async (fileId: string, file: File) => {
    const [preview, count] = await Promise.all([
      loader.parsePreview(file),
      loader.countRows(file),
    ])
    updateFile(fileId, {
      headers:     preview.rows[0] ? Object.keys(preview.rows[0]) : [],
      preview:     preview.rows,
      parseErrors: preview.errors,
      rowCount:    count,
    })
  }

  // ── FileDropzone callbacks ───────────────────────────────────────────────

  const handleFiles = (newFiles: File[]) => {
    setFileEntries(prev => {
      const prevMap = new Map(prev.map(e => [e.file.name, e]))
      return newFiles.map(f => prevMap.get(f.name) ?? makeFileEntry(f))
    })
    setSelectedFileId(id => {
      if (!id) return id
      const names = new Set(newFiles.map(f => f.name))
      // Will be re-checked against updated entries on next render — safe fallback
      return names.size > 0 ? id : null
    })
  }

  const handleFileSelect = async (file: File) => {
    setFileEntries(prev => {
      const entry = prev.find(e => e.file.name === file.name)
      if (entry) {
        setSelectedFileId(entry.id)
        if (entry.headers.length === 0) loadPreview(entry.id, file)
      }
      return prev
    })
    setPreviewOpen(false)
  }

  const handleAddPivot = (file: File) => {
    setFileEntries(prev => {
      const entry = prev.find(e => e.file.name === file.name)
      if (!entry) return prev
      const pivot = makePivot(entry.pivots.length + 1)
      setSelectedFileId(entry.id)
      return prev.map(e => e.id !== entry.id ? e : {
        ...e,
        pivots:        [...e.pivots, pivot],
        activePivotId: pivot.id,
      })
    })
  }

  // ── Pivot compute ────────────────────────────────────────────────────────

  const computePivot = (fileId: string, pivotId: string, file: File, config: PivotConfig) => {
    workerRef.current?.terminate()
    computingRef.current = { fileId, pivotId }
    updatePivot(fileId, pivotId, { status: 'computing', progress: 0, result: null })

    const worker = new Worker(
      new URL('./lib/pivot/worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const ctx = computingRef.current
      if (!ctx) return
      const msg = e.data
      if (msg.type === 'progress') {
        updatePivot(ctx.fileId, ctx.pivotId, { progress: msg.percent })
      } else if (msg.type === 'result') {
        updatePivot(ctx.fileId, ctx.pivotId, {
          status: 'done', result: msg.data, errors: msg.errors, progress: 100,
        })
        computingRef.current = null
        worker.terminate()
      } else if (msg.type === 'error') {
        updatePivot(ctx.fileId, ctx.pivotId, { status: 'error' })
        computingRef.current = null
        worker.terminate()
      }
    }
    worker.onerror = () => {
      const ctx = computingRef.current
      if (ctx) updatePivot(ctx.fileId, ctx.pivotId, { status: 'error' })
      computingRef.current = null
      worker.terminate()
    }
    worker.postMessage({ file, config })
  }

  const cancelPivot = (fileId: string, pivotId: string) => {
    workerRef.current?.terminate()
    workerRef.current = null
    computingRef.current = null
    updatePivot(fileId, pivotId, { status: 'idle', progress: 0 })
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const selectedEntry  = fileEntries.find(e => e.id === selectedFileId) ?? null
  const activePivot    = selectedEntry?.pivots.find(p => p.id === selectedEntry.activePivotId) ?? null
  const selectedFile   = selectedEntry?.pivots.length
    ? selectedEntry.file
    : undefined

  return (
    <div className="min-h-screen p-10 flex flex-col gap-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text mb-1">PivotCSV</h1>
          <p className="text-muted text-sm">Design system — aperçu des composants</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemePicker />
          <img src="/finex-icon-dark.svg" alt="Finex" className="h-15 w-auto opacity-65 hover:opacity-90 transition-opacity" />
        </div>
      </div>

      {/* Design system showcases */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary"   icon={<Plus size={15} />}>Nouveau rapport</Button>
          <Button variant="secondary" icon={<Upload size={15} />}>Importer CSV</Button>
          <Button variant="ghost"     iconEnd={<ChevronRight size={14} />}>Voir plus</Button>
          <Button variant="danger"    icon={<Trash2 size={14} />}>Supprimer</Button>
          <Button variant="primary"   loading>Chargement</Button>
          <Button variant="secondary" size="sm">Petit</Button>
          <Button variant="primary"   size="lg">Grand</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">Card</h2>
        <div className="grid grid-cols-3 gap-4">
          <Card><p className="text-sm text-text font-semibold mb-1">Surface</p><p className="text-xs text-muted">Carte standard</p></Card>
          <Card elevated><p className="text-sm text-text font-semibold mb-1">Elevated</p><p className="text-xs text-muted">Ombre renforcée</p></Card>
          <Card glow><p className="text-sm text-text font-semibold mb-1">Glow</p><p className="text-xs text-muted">Halo accent</p></Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">Badge</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="accent"  dot>Accent</Badge>
          <Badge variant="success" dot>Succès</Badge>
          <Badge variant="warning" dot>Attention</Badge>
          <Badge variant="danger"  dot>Erreur</Badge>
          <Badge variant="neutral">Neutre</Badge>
        </div>
      </section>

      {/* Import CSV */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">Fichiers</h2>
        <div className="max-w-lg flex flex-col gap-4">
          <FileDropzone
            accept=".csv"
            multiple
            onFiles={handleFiles}
            onFileSelect={handleFileSelect}
            onAddPivot={handleAddPivot}
            selectedFile={selectedFile}
          />

          {/* Preview du fichier sélectionné */}
          {selectedEntry && (
            <Card elevated padding="none">
              <button
                onClick={() => setPreviewOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors rounded-[var(--radius-lg)]"
              >
                <div className="flex items-center gap-3">
                  <ChevronsUpDown size={14} className="text-muted flex-shrink-0" />
                  <span className="text-sm text-text font-semibold">
                    {selectedEntry.rowCount === null ? '…' : selectedEntry.rowCount.toLocaleString('fr-FR')} lignes
                    — {selectedEntry.headers.length} colonnes
                  </span>
                </div>
                <Badge variant={selectedEntry.parseErrors.filter(e => e.severity === 'error').length === 0 ? 'success' : 'danger'} dot>
                  {selectedEntry.parseErrors.filter(e => e.severity === 'error').length === 0 ? 'Valide' : 'Erreurs'}
                </Badge>
              </button>

              {previewOpen && selectedEntry.preview.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-elevated border-b border-border">
                          {selectedEntry.headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left text-muted font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntry.preview.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="px-3 py-1.5 text-text/80 whitespace-nowrap">{String(v ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </section>

      {/* Pivots de la sélection */}
      {selectedEntry && selectedEntry.pivots.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">
            Pivots — {selectedEntry.file.name}
          </h2>

          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border pb-0">
            {selectedEntry.pivots.map(pivot => (
              <button
                key={pivot.id}
                onClick={() => updateFile(selectedEntry.id, { activePivotId: pivot.id })}
                className={[
                  'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-[var(--radius-md)]',
                  'border border-b-0 transition-all duration-150 -mb-px',
                  pivot.id === selectedEntry.activePivotId
                    ? 'bg-elevated border-border text-text'
                    : 'border-transparent text-muted hover:text-text hover:bg-elevated/50',
                ].join(' ')}
              >
                <span>{pivot.label}</span>
                {pivot.status === 'done' && <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />}
                {pivot.status === 'computing' && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />}
                {pivot.status === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    const remaining = selectedEntry.pivots.filter(p => p.id !== pivot.id)
                    const newActive = remaining.find(p => p.id === selectedEntry.activePivotId)?.id
                      ?? remaining[remaining.length - 1]?.id
                      ?? null
                    updateFile(selectedEntry.id, { pivots: remaining, activePivotId: newActive })
                  }}
                  className="text-subtle hover:text-danger transition-colors ml-0.5"
                >
                  <X size={11} />
                </button>
              </button>
            ))}
            <button
              onClick={() => handleAddPivot(selectedEntry.file)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-subtle hover:text-accent transition-colors ml-1"
              title="Ajouter un pivot"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Contenu du pivot actif */}
          {activePivot && (
            <Card elevated>
              <PivotConfigurator
                value={activePivot.configuratorState}
                onChange={state => updatePivot(selectedEntry.id, activePivot.id, { configuratorState: state })}
                headers={selectedEntry.headers}
                preview={selectedEntry.preview}
                status={activePivot.status}
                progress={activePivot.progress}
                onCompute={config => computePivot(selectedEntry.id, activePivot.id, selectedEntry.file, config)}
                onCancel={() => cancelPivot(selectedEntry.id, activePivot.id)}
              />

              {activePivot.result && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted">
                    {activePivot.result.rowKeys.length} ligne(s) × {activePivot.result.colKeys.length} colonne(s)
                  </p>
                </div>
              )}
            </Card>
          )}
        </section>
      )}

    </div>
  )
}
