import { useState }            from 'react'
import { useTheme, THEMES }    from '@/context/ThemeContext'
import { usePivotComputation } from './hooks/usePivotComputation'
import { useSections }         from './hooks/useSections'
import { useFileEntries }      from './hooks/useFileEntries'
import { usePresentationQueue } from './hooks/usePresentationQueue'
import { useSectionsDnD }      from './hooks/useSectionsDnD'
import { usePersistence }      from './hooks/usePersistence'

export function useReportPage() {
  const { theme, setTheme }            = useTheme()
  const [sidebarOpen, setSidebarOpen]  = useState(true)

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

  const { computeSection, cancelSection, runWorker } = usePivotComputation({
    sections, fileEntries, updateSection,
  })

  const {
    presentationOpen, presentationLoading,
    openPresentation, closePresentation,
  } = usePresentationQueue({ sections, fileEntries, runWorker })

  const { sensors, draggingId, onDragStart, onDragEnd } = useSectionsDnD({ setSections })

  usePersistence({
    fileEntries, sections, sidebarOpen,
    setSidebarOpen, setFileEntries, setSections,
    syncDistinctValues,
  })

  // ── Wrappers cross-hook ──────────────────────────────────────────────────

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

  const deleteSection = (sectionId: string) => {
    const section = removeSection(sectionId)
    if (section) decrementPivotCount(section.fileId)
  }

  return {
    // theme
    theme, setTheme, THEMES,
    // layout
    sidebarOpen, setSidebarOpen,
    // data
    fileEntries, sections,
    draggingSection:    sections.find(s => s.id === draggingId) ?? null,
    canPresent:         sections.some(s => s.config !== null),
    presentableSections: sections.filter(s => s.result !== null),
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
