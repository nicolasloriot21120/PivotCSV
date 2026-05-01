import { useRef, useState, useEffect, useCallback } from 'react'
import {
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove }           from '@dnd-kit/sortable'
import { useTheme, THEMES }    from '@/context/ThemeContext'
import { emptyConfiguratorState } from '@/components/PivotConfigurator/types'
import { CSVLoader }           from '@/lib/loader'
import { saveState, loadState } from '@/lib/persistence'
import type { PivotConfig }    from '@/lib/pivot/types'
import type { WorkerResponse } from '@/lib/pivot/worker'
import type { FileEntry, Section } from '@/types/app'

type QueueItem = { sectionId: string; file: File; config: PivotConfig }

const loader = new CSVLoader()

// Migration : anciens configs persistés avaient rows/columns: string[]
function normalizeConfig(config: PivotConfig | null): PivotConfig | null {
  if (!config) return null
  return {
    ...config,
    rows:    config.rows.map((f: any) => typeof f === 'string' ? { field: f } : f),
    columns: config.columns.map((f: any) => typeof f === 'string' ? { field: f } : f),
  }
}

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
    errorMessage:      null,
    status:            'idle',
    progress:          0,
    config:             null,
    collapsedRowGroups: [],
    collapsedColGroups: [],
    chartType:          'bar',
    chartLayout:        'horizontal',
    tableFlex:          5,
    chartFlex:          5,
    valueScale:         'none',
    valueDecimals:      2,
    chartColors:        {},
    chartTranspose:     false,
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
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredRef  = useRef(false)

  const [presentationLoading, setPresentationLoading] = useState(false)
  const [presentationOpen,    setPresentationOpen]    = useState(false)
  const presentationQueueRef = useRef<QueueItem[]>([])

  // Restauration initiale (async — IndexedDB)
  useEffect(() => {
    loadState().then(state => {
      if (state) {
        setSidebarOpen(state.sidebarOpen)
        setFileEntries(state.fileEntries)
        setSections(state.sections.map(s => ({
          ...s,
          config:             normalizeConfig(s.config),
          collapsedRowGroups: s.collapsedRowGroups ?? [],
          collapsedColGroups: s.collapsedColGroups ?? [],
          chartType:          s.chartType     ?? 'bar',
          chartLayout:        s.chartLayout   ?? 'horizontal',
          tableFlex:          s.tableFlex     ?? 5,
          chartFlex:          s.chartFlex     ?? 5,
          valueScale:         s.valueScale    ?? 'none',
          valueDecimals:      s.valueDecimals ?? 2,
          chartColors:        s.chartColors     ?? {},
          chartTranspose:     s.chartTranspose  ?? false,
        })))
        // Rescanner les valeurs distinctes pour les fichiers restaurés (non persistées).
        // Met aussi à jour les FilterField des sections associées.
        for (const entry of state.fileEntries) {
          loader.scanDistinctValues(entry.file).then(dv => {
            setFileEntries(fs => fs.map(f => f.id === entry.id ? { ...f, distinctValues: dv } : f))
            setSections(ss => ss.map(s => {
              if (s.fileId !== entry.id) return s
              const updatedFilters = s.configuratorState.filters.map(f =>
                f.type === 'string' ? { ...f, distinctValues: dv[f.field] ?? f.distinctValues } : f
              )
              return { ...s, configuratorState: { ...s.configuratorState, filters: updatedFilters } }
            }))
          })
        }
      }
      restoredRef.current = true
    })
  }, [])

  // Sauvegarde debounced — uniquement après la restauration initiale
  useEffect(() => {
    if (!restoredRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveState(fileEntries, sections, sidebarOpen), 500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [fileEntries, sections, sidebarOpen])

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
    // Scan des valeurs distinctes en arrière-plan — non-bloquant.
    // Met à jour FileEntry ET les FilterField des sections qui utilisent ce fichier,
    // pour que les filtres ajoutés avant la fin du scan voient toutes les valeurs.
    loader.scanDistinctValues(file).then(dv => {
      updateFileEntry(fileId, { distinctValues: dv })
      setSections(ss => ss.map(s => {
        if (s.fileId !== fileId) return s
        const updatedFilters = s.configuratorState.filters.map(f =>
          f.type === 'string' ? { ...f, distinctValues: dv[f.field] ?? f.distinctValues } : f
        )
        return { ...s, configuratorState: { ...s.configuratorState, filters: updatedFilters } }
      }))
    })
  }

  const handleFiles = (newFiles: File[]) => {
    setFileEntries(prev => {
      const prevMap = new Map(prev.map(e => [e.file.name, e]))
      return newFiles.map(f => prevMap.get(f.name) ?? {
        id: crypto.randomUUID(), file: f,
        headers: [], preview: [], parseErrors: [], rowCount: null, pivotCount: 0,
        distinctValues: {},
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

  const handleRemoveFile = (file: File) => {
    const entry = fileEntries.find(e => e.file.name === file.name)
    if (!entry) return
    setSections(ss => ss.filter(s => s.fileId !== entry.id))
    setFileEntries(fs => fs.filter(e => e.id !== entry.id))
  }

  const handleAddPivot = (file: File) => {
    const entry = fileEntries.find(e => e.file.name === file.name)
    if (!entry) return

    const pivotIndex = sections.filter(s => s.fileId === entry.id).length + 1
    const section    = makeSection(entry.id, file.name, pivotIndex)

    setSections(ss => [...ss, section])
    setFileEntries(fs => fs.map(e => e.id === entry.id ? { ...e, pivotCount: e.pivotCount + 1 } : e))
    if (entry.headers.length === 0) loadPreview(entry.id, file)
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
          progress: 100,
        })
        computingRef.current = null
        worker.terminate()
      } else if (msg.type === 'error') {
        updateSection(ctx.sectionId, { status: 'error', errorMessage: msg.message })
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

  // ── Mode présentation ─────────────────────────────────────────────────────

  const computeNextInQueue = useCallback(() => {
    const queue = presentationQueueRef.current
    if (queue.length === 0) {
      setPresentationLoading(false)
      setPresentationOpen(true)
      return
    }

    const { sectionId, file, config } = queue[0]

    workerRef.current?.terminate()
    computingRef.current = { sectionId }
    updateSection(sectionId, { status: 'computing', progress: 0, result: null, config })

    const worker = new Worker(
      new URL('../../lib/pivot/worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    const advance = () => {
      presentationQueueRef.current = presentationQueueRef.current.slice(1)
      computeNextInQueue()
    }

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data
      if (msg.type === 'progress') {
        updateSection(sectionId, { progress: msg.percent })
      } else if (msg.type === 'result') {
        updateSection(sectionId, { status: 'done', result: msg.data, errors: msg.errors, progress: 100 })
        computingRef.current = null
        worker.terminate()
        advance()
      } else if (msg.type === 'error') {
        updateSection(sectionId, { status: 'error', errorMessage: msg.message })
        computingRef.current = null
        worker.terminate()
        advance()
      }
    }
    worker.onerror = () => {
      if (computingRef.current) updateSection(sectionId, { status: 'error' })
      computingRef.current = null
      worker.terminate()
      advance()
    }

    worker.postMessage({ file, config })
  }, [updateSection]) // workerRef, computingRef, presentationQueueRef sont des refs stables

  const openPresentation = useCallback(() => {
    const toCompute: QueueItem[] = []
    for (const s of sections) {
      if (s.config && !s.result) {
        const entry = fileEntries.find(f => f.id === s.fileId)
        if (entry) toCompute.push({ sectionId: s.id, file: entry.file, config: s.config })
      }
    }
    if (toCompute.length === 0) {
      setPresentationOpen(true)
      return
    }
    presentationQueueRef.current = toCompute
    setPresentationLoading(true)
    computeNextInQueue()
  }, [sections, fileEntries, computeNextInQueue])

  const closePresentation = useCallback(() => setPresentationOpen(false), [])

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
    handleFiles, handleFileSelect, handleAddPivot, handleRemoveFile,
    // handlers — sections
    updateSection, deleteSection, computeSection, cancelSection,
    // présentation
    presentationLoading, presentationOpen, openPresentation, closePresentation,
    // handlers — dnd
    onDragStart, onDragEnd,
  }
}
