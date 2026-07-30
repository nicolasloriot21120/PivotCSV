import { useRef, useState, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { validateFiles } from '../lib/validateFiles'

export type DropState = 'idle' | 'hover' | 'error'

export type UseFileDropzoneProps = {
  accept:       string
  multiple:     boolean
  maxSizeMb:    number
  onFiles:      (files: File[]) => void
  onFileSelect?: (file: File) => void
  selectedFile?: File
}

export function useFileDropzone({ accept, multiple: _multiple, maxSizeMb, onFiles, onFileSelect, selectedFile }: UseFileDropzoneProps) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [state, setState]     = useState<DropState>('idle')
  const [error, setError]     = useState<string | null>(null)
  const [dropped, setDropped] = useState<File[]>([])

  const handle = useCallback((files: File[]) => {
    setError(null)
    const result = validateFiles(files, accept, maxSizeMb)
    if (result.error !== null) { setError(result.error); setState('error'); return }

    setState('idle')
    const existing = new Set(dropped.map(f => f.name))
    const newFiles = result.files.filter(f => !existing.has(f.name))
    const next     = [...dropped, ...newFiles]
    setDropped(next)
    onFiles(next)
    onFileSelect?.(result.files[0])
  }, [accept, maxSizeMb, dropped, onFiles, onFileSelect])

  const onDragOver  = useCallback((e: DragEvent) => { e.preventDefault(); setState('hover') }, [])
  const onDragLeave = useCallback(() => setState('idle'), [])
  const onDrop      = useCallback((e: DragEvent) => { e.preventDefault(); handle(Array.from(e.dataTransfer.files)) }, [handle])
  const onChange    = useCallback((e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) handle(Array.from(e.target.files)) }, [handle])

  const removeFile = useCallback((name: string) => {
    const next = dropped.filter(f => f.name !== name)
    setDropped(next)
    onFiles(next)
    if (selectedFile?.name === name) onFileSelect?.(next[0])
    setError(null)
    setState('idle')
  }, [dropped, onFiles, onFileSelect, selectedFile])

  return { inputRef, state, error, dropped, onDragOver, onDragLeave, onDrop, onChange, removeFile }
}
