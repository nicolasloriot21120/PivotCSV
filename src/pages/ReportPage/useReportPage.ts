import { useRef, useState, useEffect, useCallback } from 'react'
import {
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove }           from '@dnd-kit/sortable'
import { useTheme, THEMES }    from '@/context/ThemeContext'
import { saveState, loadState } from '@/lib/persistence'
import type { PivotConfig }    from '@/lib/pivot/types'
import { usePivotComputation } from './hooks/usePivotComputation'
import { useSections }         from './hooks/useSections'
import { useFileEntries, loader } from './hooks/useFileEntries'

type QueueItem = { sectionId: string; file: File; config: PivotConfig }

// Migration : anciens configs persistés avaient rows/columns: string[]
function normalizeConfig(config: PivotConfig | null): PivotConfig | null {
  if (!config) return null
  return {
    ...config,
    rows:    config.rows.map((f: any) => typeof f === 'string' ? { field: f } : f),
    columns: config.columns.map((f: any) => typeof f === 'string' ? { field: f } : f),
  }
}

export function useReportPage() {
  const { theme, setTheme }                 = useTheme()

  const [sidebarOpen,  setSidebarOpen]      = useState(true)
  const [draggingId,   setDraggingId]       = useState<string | null>(null)

  const {
    sections, setSections,
    updateSection, removeSection,
    addPivotForFile, removeSectionsByFileId,
  } = useSections()

  const {
    fileEntries, setFileEntries,
    loadPreview, syncDistinctValues,
    addFiles, removeFile,
    incrementPivotCount, decrementPivotCount,
  } = useFileEntries({ setSections })

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
        for (const entry of state.fileEntries) {
          loader.scanDistinctValues(entry.file).then(dv => syncDistinctValues(entry.id, dv))
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
    removeSectionsByFileId(entry.id)
    removeFile(entry.id)
  }

  const handleAddPivot = (file: File) => {
    const entry = fileEntries.find(e => e.file.name === file.name)
    if (!entry) return
    addPivotForFile(entry.id, file.name)
    incrementPivotCount(entry.id)
    if (entry.headers.length === 0) loadPreview(entry.id, file)
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  const deleteSection = (sectionId: string) => {
    const section = removeSection(sectionId)
    if (section) decrementPivotCount(section.fileId)
  }

  // ── Compute ───────────────────────────────────────────────────────────────

  const { computeSection, cancelSection, runWorker } = usePivotComputation({
    sections, fileEntries, updateSection,
  })

  // ── Mode présentation ─────────────────────────────────────────────────────

  const computeNextInQueue = useCallback(() => {
    const queue = presentationQueueRef.current
    if (queue.length === 0) {
      setPresentationLoading(false)
      setPresentationOpen(true)
      return
    }
    const { sectionId, file, config } = queue[0]
    runWorker({
      sectionId, file, config,
      onDone: () => {
        presentationQueueRef.current = presentationQueueRef.current.slice(1)
        computeNextInQueue()
      },
    })
  }, [runWorker])

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
    handleFiles: addFiles, handleFileSelect, handleAddPivot, handleRemoveFile,
    // handlers — sections
    updateSection, deleteSection, computeSection, cancelSection,
    // présentation
    presentationLoading, presentationOpen, openPresentation, closePresentation,
    // handlers — dnd
    onDragStart, onDragEnd,
  }
}
