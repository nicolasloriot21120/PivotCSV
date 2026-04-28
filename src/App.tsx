import { useRef, useState }       from 'react'
import {
  DndContext, PointerSensor,
  useSensor, useSensors, DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS }                    from '@dnd-kit/utilities'
import { LayoutGrid } from 'lucide-react'

import { AppSidebar }           from '@/components/AppSidebar'
import { PivotSection }         from '@/components/PivotSection'
import { ThemePicker }          from '@/components/ui/ThemePicker'
import { useTheme, THEMES }     from '@/context/ThemeContext'
import { emptyConfiguratorState } from '@/components/PivotConfigurator/types'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'
import { CSVLoader }            from '@/lib/loader'
import type { ParseError, RawRow } from '@/lib/loader'
import type { PivotConfig, PivotData } from '@/lib/pivot/types'
import type { WorkerResponse }  from '@/lib/pivot/worker'
import type { FileEntry, Section } from '@/types/app'

const loader = new CSVLoader()

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSection(fileId: string, fileName: string, index: number): Section {
  return {
    id:                crypto.randomUUID(),
    fileId,
    fileName,
    label:             `Pivot ${index}`,
    collapsed:         false,
    configuratorOpen:  true,
    configuratorState: emptyConfiguratorState(),
    result:            null,
    errors:            [],
    status:            'idle',
    progress:          0,
    config:            null,
  }
}

// ── Sortable wrapper ────────────────────────────────────────────────────────

type SortableProps = {
  section:    Section
  headers:    string[]
  preview:    RawRow[]
  onUpdate:   (patch: Partial<Section>) => void
  onCompute:  (config: PivotConfig) => void
  onCancel:   () => void
  onDelete:   () => void
}

function SortablePivotSection({ section, headers, preview, onUpdate, onCompute, onCancel, onDelete }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <PivotSection
        section={section}
        headers={headers}
        preview={preview}
        dragHandleAttrs={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
        onLabelChange={label      => onUpdate({ label })}
        onToggleCollapse={()      => onUpdate({ collapsed: !section.collapsed })}
        onToggleConfigurator={()  => onUpdate({ configuratorOpen: !section.configuratorOpen })}
        onConfigChange={state     => onUpdate({ configuratorState: state })}
        onCompute={onCompute}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    </div>
  )
}

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { theme, setTheme } = useTheme()
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [fileEntries,  setFileEntries]  = useState<FileEntry[]>([])
  const [sections,     setSections]     = useState<Section[]>([])
  const [draggingId,   setDraggingId]   = useState<string | null>(null)

  const workerRef    = useRef<Worker | null>(null)
  const computingRef = useRef<{ sectionId: string } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }))

  // ── File helpers ──────────────────────────────────────────────────────────

  const updateFileEntry = (fileId: string, patch: Partial<FileEntry>) =>
    setFileEntries(fs => fs.map(f => f.id === fileId ? { ...f, ...patch } : f))

  const loadPreview = async (fileId: string, file: File) => {
    const [preview, count] = await Promise.all([
      loader.parsePreview(file),
      loader.countRows(file),
    ])
    updateFileEntry(fileId, {
      headers:     preview.rows[0] ? Object.keys(preview.rows[0]) : [],
      preview:     preview.rows,
      parseErrors: preview.errors,
      rowCount:    count,
    })
  }

  const handleFiles = (newFiles: File[]) => {
    setFileEntries(prev => {
      const prevMap = new Map(prev.map(e => [e.file.name, e]))
      return newFiles.map(f => prevMap.get(f.name) ?? {
        id: crypto.randomUUID(), file: f,
        headers: [], preview: [], parseErrors: [], rowCount: null, pivotCount: 0,
      })
    })
  }

  const handleFileSelect = (file: File) => {
    setFileEntries(prev => {
      const entry = prev.find(e => e.file.name === file.name)
      if (entry && entry.headers.length === 0) loadPreview(entry.id, file)
      return prev
    })
  }

  const handleAddPivot = (file: File) => {
    setFileEntries(prev => {
      const entry = prev.find(e => e.file.name === file.name)
      if (!entry) return prev

      const fileIndex = prev.filter(e => e.id === entry.id)[0]
      const pivotIndex = sections.filter(s => s.fileId === entry.id).length + 1
      const section = makeSection(entry.id, file.name, pivotIndex)

      setSections(ss => [...ss, section])

      if (entry.headers.length === 0) loadPreview(entry.id, file)

      return prev.map(e => e.id === entry.id
        ? { ...e, pivotCount: e.pivotCount + 1 }
        : e
      )
    })
  }

  // ── Section helpers ───────────────────────────────────────────────────────

  const updateSection = (sectionId: string, patch: Partial<Section>) =>
    setSections(ss => ss.map(s => s.id === sectionId ? { ...s, ...patch } : s))

  const deleteSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    setSections(ss => ss.filter(s => s.id !== sectionId))
    if (section) {
      setFileEntries(fs => fs.map(f =>
        f.id === section.fileId ? { ...f, pivotCount: Math.max(0, f.pivotCount - 1) } : f
      ))
    }
  }

  // ── Compute ───────────────────────────────────────────────────────────────

  const computeSection = (sectionId: string, config: PivotConfig) => {
    const section = sections.find(s => s.id === sectionId)
    const entry   = fileEntries.find(f => f.id === section?.fileId)
    if (!section || !entry) return

    workerRef.current?.terminate()
    computingRef.current = { sectionId }
    updateSection(sectionId, { status: 'computing', progress: 0, result: null, config })

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
        updateSection(ctx.sectionId, { progress: msg.percent })
      } else if (msg.type === 'result') {
        updateSection(ctx.sectionId, {
          status: 'done', result: msg.data, errors: msg.errors,
          progress: 100, configuratorOpen: false,
        })
        computingRef.current = null
        worker.terminate()
      } else if (msg.type === 'error') {
        updateSection(ctx.sectionId, { status: 'error' })
        computingRef.current = null
        worker.terminate()
      }
    }
    worker.onerror = () => {
      const ctx = computingRef.current
      if (ctx) updateSection(ctx.sectionId, { status: 'error' })
      computingRef.current = null
      worker.terminate()
    }
    worker.postMessage({ file: entry.file, config })
  }

  const cancelSection = (sectionId: string) => {
    workerRef.current?.terminate()
    workerRef.current    = null
    computingRef.current = null
    updateSection(sectionId, { status: 'idle', progress: 0 })
  }

  // ── DnD sections ─────────────────────────────────────────────────────────

  const onDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id))
  const onDragEnd   = (e: DragEndEvent)   => {
    setDraggingId(null)
    if (!e.over || e.active.id === e.over.id) return
    setSections(ss => {
      const from = ss.findIndex(s => s.id === e.active.id)
      const to   = ss.findIndex(s => s.id === e.over!.id)
      return arrayMove(ss, from, to)
    })
  }

  const draggingSection = sections.find(s => s.id === draggingId) ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-base">

      {/* Sidebar */}
      <AppSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        fileEntries={fileEntries}
        onFiles={handleFiles}
        onFileSelect={handleFileSelect}
        onAddPivot={handleAddPivot}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header sticky */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface flex-shrink-0">
          <div className="flex items-center gap-2 text-muted">
            <LayoutGrid size={14} />
            <span className="text-xs font-medium">
              {sections.length === 0
                ? 'Aucune section — ajoutez un pivot depuis la sidebar'
                : `${sections.length} section${sections.length > 1 ? 's' : ''}`
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemePicker themes={THEMES} value={theme} onChange={setTheme} />
            <img
              src="/finex-icon-dark.svg"
              alt="Finex"
              className="h-7 w-auto opacity-50 hover:opacity-80 transition-opacity"
            />
          </div>
        </header>

        {/* Canvas sections */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <LayoutGrid size={32} className="text-subtle" />
              <p className="text-muted text-sm font-medium">Aucune section</p>
              <p className="text-subtle text-xs max-w-xs">
                Importez un fichier CSV dans la sidebar puis cliquez sur&nbsp;
                <span className="text-accent">+</span> pour créer votre premier pivot.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4">
                  {sections.map(section => {
                    const entry = fileEntries.find(f => f.id === section.fileId)
                    return (
                      <SortablePivotSection
                        key={section.id}
                        section={section}
                        headers={entry?.headers ?? []}
                        preview={entry?.preview ?? []}
                        onUpdate={patch => updateSection(section.id, patch)}
                        onCompute={config => computeSection(section.id, config)}
                        onCancel={() => cancelSection(section.id)}
                        onDelete={() => deleteSection(section.id)}
                      />
                    )
                  })}
                </div>
              </SortableContext>

              <DragOverlay>
                {draggingSection && (
                  <div className="rounded-[var(--radius-lg)] border border-accent/40 bg-surface shadow-[var(--shadow-elevated)] px-4 py-3 opacity-90">
                    <span className="text-sm font-semibold text-text">{draggingSection.label}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </main>
      </div>
    </div>
  )
}
