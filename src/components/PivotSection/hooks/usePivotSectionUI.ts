import { useState, useEffect } from 'react'
import { makeFormatter }       from '@/lib/pivot/format'
import { getSeriesLabels }     from '@/lib/pivot/chart'
import type { Section }        from '@/types/app'

export function usePivotSectionUI(section: Section) {
  const [editingLabel,    setEditingLabel]    = useState(false)
  const [activeTab,       setActiveTab]       = useState<'config' | 'result'>('config')
  const [showRowTotals,   setShowRowTotals]   = useState(true)
  const [showColTotals,   setShowColTotals]   = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Bascule sur l'onglet résultat dès qu'un calcul aboutit
  useEffect(() => {
    if (section.status === 'done') setActiveTab('result')
  }, [section.status])

  const hasResult    = section.result !== null
  const isHorizontal = section.chartLayout === 'horizontal'
  const formatValue  = makeFormatter(section.valueScale, section.valueDecimals)
  const seriesLabels = section.result
    ? getSeriesLabels(
        section.result,
        section.chartType,
        section.collapsedRowGroups,
        section.collapsedColGroups,
        section.chartTranspose,
      )
    : []
  const canTranspose = section.chartType !== 'pie' && (section.result?.colKeys.length ?? 0) > 0

  return {
    editingLabel,    setEditingLabel,
    activeTab,       setActiveTab,
    showRowTotals,   setShowRowTotals,
    showColTotals,   setShowColTotals,
    showColorPicker, setShowColorPicker,
    hasResult, isHorizontal, formatValue, seriesLabels, canTranspose,
  }
}
