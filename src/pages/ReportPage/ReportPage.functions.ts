import { useRef, useState }   from 'react'
import {
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove }           from '@dnd-kit/sortable'
import { useTheme, THEMES }    from '@/context/ThemeContext'
import { emptyConfiguratorState } from '@/components/PivotConfigurator/types'
import { CSVLoader }           from '@/lib/loader'
import type { PivotConfig }    from '@/lib/pivot/types'
import type { WorkerResponse } from '@/lib/pivot/worker'
import type { FileEntry, Section } from '@/types/app'

const loader = new CSVLoader()

export function makeSection(fileId: string, fileName: string, index: number): Section {
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

export function useReportPage() {
  const { theme, setTheme }                 = useTheme()
  const [sidebarOpen,  setSidebarOpen]      = useState(true)
  const [fileEntries,  setFileEntries]      = useState<FileEntry[]>([])
  const [sections,     setSections]         = useState<Section[]>([])
  const [draggingId,   setDraggingId]       = useState<string | null>(null)

  const workerRef    = useRef<Worker | null>(null)
  const computingRef = useRef<{ sectionId: string } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }))

  // ── File ─────────────────────────────────────────────────────────────────

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

      const pivotIndex = sections.filter(s => s.fileId === entry.id).length + 1
      const section    = makeSection(entry.id, file.name, pivotIndex)

      setSections(ss => [...ss, section])
      if (entry.headers.length === 0) loadPreview(entry.id, file)

      return prev.map(e => e.id === entry.id ? { ...e, pivotCount: e.pivotCount + 1 } : e)
    })
  }

  // ── Sections ──────────────────────────────────────────────────────────────

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
      new URL('../../lib/pivot/worker.ts', import.meta.url),
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

  // ── DnD ───────────────────────────────────────────────────────────────────

  const onDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id))

  const onDragEnd = (e: DragEndEvent) => {
    setDraggingId(null)
    if (!e.over || e.active.id === e.over.id) return
    setSections(ss => {
      const from = ss.findIndex(s => s.id === e.active.id)
      const to   = ss.findIndex(s => s.id === e.over!.id)
      return arrayMove(ss, from, to)
    })
  }

  return {
    // theme
    theme, setTheme, THEMES,
    // layout
    sidebarOpen, setSidebarOpen,
    // data
    fileEntries, sections,
    draggingSection: sections.find(s => s.id === draggingId) ?? null,
    // sensors
    sensors,
    // handlers — fichiers
    handleFiles, handleFileSelect, handleAddPivot,
    // handlers — sections
    updateSection, deleteSection, computeSection, cancelSection,
    // handlers — dnd
    onDragStart, onDragEnd,
  }
}
