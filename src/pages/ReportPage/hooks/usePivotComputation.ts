import { useCallback, useRef } from 'react'
import type { PivotConfig }    from '@/lib/pivot/types'
import type { WorkerResponse } from '@/lib/pivot/worker'
import type { FileEntry, Section } from '@/types/app'

type RunWorkerArgs = {
  sectionId: string
  file:      File
  config:    PivotConfig
  onDone?:   () => void
}

type Args = {
  sections:      Section[]
  fileEntries:   FileEntry[]
  updateSection: (id: string, patch: Partial<Section>) => void
}

export function usePivotComputation({ sections, fileEntries, updateSection }: Args) {
  const workerRef    = useRef<Worker | null>(null)
  const computingRef = useRef<{ sectionId: string } | null>(null)

  const runWorker = useCallback(({ sectionId, file, config, onDone }: RunWorkerArgs) => {
    workerRef.current?.terminate()
    computingRef.current = { sectionId }
    updateSection(sectionId, { status: 'computing', progress: 0, result: null, config })

    const worker = new Worker(
      new URL('../../../lib/pivot/worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (!computingRef.current) return
      const msg = e.data
      if (msg.type === 'progress') {
        updateSection(sectionId, { progress: msg.percent })
      } else if (msg.type === 'result') {
        updateSection(sectionId, {
          status: 'done', result: msg.data, errors: msg.errors, progress: 100,
        })
        computingRef.current = null
        worker.terminate()
        onDone?.()
      } else if (msg.type === 'error') {
        updateSection(sectionId, { status: 'error', errorMessage: msg.message })
        computingRef.current = null
        worker.terminate()
        onDone?.()
      }
    }
    worker.onerror = () => {
      if (computingRef.current) updateSection(sectionId, { status: 'error' })
      computingRef.current = null
      worker.terminate()
      onDone?.()
    }
    worker.postMessage({ file, config })
  }, [updateSection])

  const computeSection = useCallback((sectionId: string, config: PivotConfig) => {
    const section = sections.find(s => s.id === sectionId)
    const entry   = fileEntries.find(f => f.id === section?.fileId)
    if (!section || !entry) return
    runWorker({ sectionId, file: entry.file, config })
  }, [sections, fileEntries, runWorker])

  const cancelSection = useCallback((sectionId: string) => {
    workerRef.current?.terminate()
    workerRef.current    = null
    computingRef.current = null
    updateSection(sectionId, { status: 'idle', progress: 0 })
  }, [updateSection])

  return { computeSection, cancelSection, runWorker }
}
