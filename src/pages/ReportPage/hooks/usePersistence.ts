import { useEffect, useRef } from 'react'
import { loadState, saveState } from '@/lib/persistence'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { FileEntry, Section } from '@/types/app'
import { loader }               from './useFileEntries'

// Migration : anciens configs persistés avaient rows/columns: string[]
function normalizeConfig(config: PivotConfig | null): PivotConfig | null {
  if (!config) return null
  return {
    ...config,
    rows:    config.rows.map((f: any) => typeof f === 'string' ? { field: f } : f),
    columns: config.columns.map((f: any) => typeof f === 'string' ? { field: f } : f),
  }
}

type Args = {
  fileEntries:        FileEntry[]
  sections:           Section[]
  sidebarOpen:        boolean
  setSidebarOpen:     (v: boolean) => void
  setFileEntries:     React.Dispatch<React.SetStateAction<FileEntry[]>>
  setSections:        React.Dispatch<React.SetStateAction<Section[]>>
  syncDistinctValues: (fileId: string, dv: Record<string, string[]>) => void
}

export function usePersistence({
  fileEntries, sections, sidebarOpen,
  setSidebarOpen, setFileEntries, setSections,
  syncDistinctValues,
}: Args) {
  const restoredRef = useRef(false)
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

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
}
