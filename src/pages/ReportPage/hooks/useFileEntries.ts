import { useCallback, useState } from 'react'
import { CSVLoader }            from '@/lib/loader'
import type { FileEntry, Section } from '@/types/app'

export const loader = new CSVLoader()

type Args = {
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
}

// Met à jour les FilterField des sections d'un fichier après scan distinctValues.
function applyDistinctValuesToSections(
  setSections: Args['setSections'],
  fileId: string,
  dv: Record<string, string[]>,
) {
  setSections(ss => ss.map(s => {
    if (s.fileId !== fileId) return s
    const updatedFilters = s.configuratorState.filters.map(f =>
      f.type === 'string' ? { ...f, distinctValues: dv[f.field] ?? f.distinctValues } : f
    )
    return { ...s, configuratorState: { ...s.configuratorState, filters: updatedFilters } }
  }))
}

export function useFileEntries({ setSections }: Args) {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])

  const updateFileEntry = useCallback((fileId: string, patch: Partial<FileEntry>) =>
    setFileEntries(fs => fs.map(f => f.id === fileId ? { ...f, ...patch } : f))
  , [])

  const syncDistinctValues = useCallback((fileId: string, dv: Record<string, string[]>) => {
    updateFileEntry(fileId, { distinctValues: dv })
    applyDistinctValuesToSections(setSections, fileId, dv)
  }, [updateFileEntry, setSections])

  const loadPreview = useCallback(async (fileId: string, file: File) => {
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
    loader.scanDistinctValues(file).then(dv => syncDistinctValues(fileId, dv))
  }, [updateFileEntry, syncDistinctValues])

  const addFiles = useCallback((newFiles: File[]) => {
    setFileEntries(prev => {
      const prevMap = new Map(prev.map(e => [e.file.name, e]))
      return newFiles.map(f => prevMap.get(f.name) ?? {
        id: crypto.randomUUID(), file: f,
        headers: [], preview: [], parseErrors: [], rowCount: null, pivotCount: 0,
        distinctValues: {},
      })
    })
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFileEntries(fs => fs.filter(e => e.id !== fileId))
  }, [])

  const incrementPivotCount = useCallback((fileId: string) => {
    setFileEntries(fs => fs.map(e =>
      e.id === fileId ? { ...e, pivotCount: e.pivotCount + 1 } : e
    ))
  }, [])

  const decrementPivotCount = useCallback((fileId: string) => {
    setFileEntries(fs => fs.map(e =>
      e.id === fileId ? { ...e, pivotCount: Math.max(0, e.pivotCount - 1) } : e
    ))
  }, [])

  return {
    fileEntries, setFileEntries,
    updateFileEntry, loadPreview, syncDistinctValues,
    addFiles, removeFile,
    incrementPivotCount, decrementPivotCount,
  }
}
