import { useRef, useState, useEffect } from 'react'
import { useTheme, THEMES }    from '@/context/ThemeContext'
import { saveState, loadState } from '@/lib/persistence'
import type { PivotConfig }    from '@/lib/pivot/types'
import { usePivotComputation } from './hooks/usePivotComputation'
import { useSections }         from './hooks/useSections'
import { useFileEntries, loader } from './hooks/useFileEntries'
import { usePresentationQueue } from './hooks/usePresentationQueue'
import { useSectionsDnD }      from './hooks/useSectionsDnD'

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

  const {
    presentationOpen, presentationLoading,
    openPresentation, closePresentation,
  } = usePresentationQueue({ sections, fileEntries, runWorker })

  // ── DnD ───────────────────────────────────────────────────────────────────

  const { sensors, draggingId, onDragStart, onDragEnd } = useSectionsDnD({ setSections })

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
