import { useCallback, useRef, useState } from 'react'
import type { PivotConfig } from '@/lib/pivot/types'
import type { FileEntry, Section } from '@/types/app'

type QueueItem = { sectionId: string; file: File; config: PivotConfig }

type RunWorker = (args: {
  sectionId: string
  file:      File
  config:    PivotConfig
  onDone?:   () => void
}) => void

type Args = {
  sections:    Section[]
  fileEntries: FileEntry[]
  runWorker:   RunWorker
}

export function usePresentationQueue({ sections, fileEntries, runWorker }: Args) {
  const [presentationLoading, setPresentationLoading] = useState(false)
  const [presentationOpen,    setPresentationOpen]    = useState(false)
  const queueRef = useRef<QueueItem[]>([])

  const computeNext = useCallback(() => {
    const queue = queueRef.current
    if (queue.length === 0) {
      setPresentationLoading(false)
      setPresentationOpen(true)
      return
    }
    const { sectionId, file, config } = queue[0]
    runWorker({
      sectionId, file, config,
      onDone: () => {
        queueRef.current = queueRef.current.slice(1)
        computeNext()
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
    queueRef.current = toCompute
    setPresentationLoading(true)
    computeNext()
  }, [sections, fileEntries, computeNext])

  const closePresentation = useCallback(() => setPresentationOpen(false), [])

  return { presentationOpen, presentationLoading, openPresentation, closePresentation }
}
