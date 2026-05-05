import { useState, useEffect, useCallback } from 'react'
import { makeFormatter } from '@/lib/pivot/format.ts'
import type { Section }  from '@/types/app.ts'

export function usePresentationMode(sections: Section[], onClose: () => void) {
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [cRows, setCRows] = useState<Record<string, string[]>>({})
  const [cCols, setCCols] = useState<Record<string, string[]>>({})

  // Initialise les états collapsed depuis les sections
  useEffect(() => {
    setCRows(Object.fromEntries(sections.map(s => [s.id, s.collapsedRowGroups])))
    setCCols(Object.fromEntries(sections.map(s => [s.id, s.collapsedColGroups])))
  }, [sections])

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex(i => Math.min(sections.length - 1, i + 1)), [sections.length])

  // Raccourcis clavier ←/→/Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')       prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  const section = sections[index]
  const formatValue = section?.result
    ? makeFormatter(section.valueScale, section.valueDecimals)
    : null
  const collapsedRowGroups = section ? (cRows[section.id] ?? section.collapsedRowGroups) : []
  const collapsedColGroups = section ? (cCols[section.id] ?? section.collapsedColGroups) : []
  const isFirst = index === 0
  const isLast  = index === sections.length - 1

  const toggleRowGroup = (pk: string) => {
    if (!section) return
    setCRows(r => ({
      ...r,
      [section.id]: collapsedRowGroups.includes(pk)
        ? collapsedRowGroups.filter(x => x !== pk)
        : [...collapsedRowGroups, pk],
    }))
  }
  const toggleColGroup = (pk: string) => {
    if (!section) return
    setCCols(r => ({
      ...r,
      [section.id]: collapsedColGroups.includes(pk)
        ? collapsedColGroups.filter(x => x !== pk)
        : [...collapsedColGroups, pk],
    }))
  }
  const setCollapsedRows = (pks: string[]) => {
    if (!section) return
    setCRows(r => ({ ...r, [section.id]: pks }))
  }
  const setCollapsedCols = (pks: string[]) => {
    if (!section) return
    setCCols(r => ({ ...r, [section.id]: pks }))
  }
  const updateNotes = (text: string) => {
    if (!section) return
    setNotes(n => ({ ...n, [section.id]: text }))
  }

  return {
    section,
    sectionIndex:   index,
    sectionsCount:  sections.length,
    isFirst, isLast,
    prev, next,
    formatValue,
    collapsedRowGroups, collapsedColGroups,
    toggleRowGroup, toggleColGroup,
    setCollapsedRows, setCollapsedCols,
    notes:    section ? (notes[section.id] ?? '') : '',
    setNotes: updateNotes,
  }
}
