import { useCallback, useState } from 'react'
import { emptyConfiguratorState } from '@/components/PivotConfigurator/types'
import type { Section } from '@/types/app'

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

export function useSections() {
  const [sections, setSections] = useState<Section[]>([])

  const updateSection = useCallback((sectionId: string, patch: Partial<Section>) => {
    setSections(ss => ss.map(s => s.id === sectionId ? { ...s, ...patch } : s))
  }, [])

  const removeSection = useCallback((sectionId: string): Section | undefined => {
    const removed = sections.find(s => s.id === sectionId)
    setSections(ss => ss.filter(s => s.id !== sectionId))
    return removed
  }, [sections])

  const addPivotForFile = useCallback((fileId: string, fileName: string) => {
    setSections(ss => [
      ...ss,
      makeSection(fileId, fileName, ss.filter(s => s.fileId === fileId).length + 1),
    ])
  }, [])

  const removeSectionsByFileId = useCallback((fileId: string) => {
    setSections(ss => ss.filter(s => s.fileId !== fileId))
  }, [])

  return {
    sections, setSections,
    updateSection, removeSection,
    addPivotForFile, removeSectionsByFileId,
  }
}
