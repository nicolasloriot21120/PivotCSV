import { useRef, useState, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'

export type FileDropzoneProps = {
  accept?:    string
  multiple?:  boolean
  maxSizeMb?: number
  onFiles:    (files: File[]) => void
  label?:     string
  hint?:      string
}

type DropState = 'idle' | 'hover' | 'error'

export function FileDropzone({
  accept     = '.csv',
  multiple   = false,
  maxSizeMb  = 10,
  onFiles,
  label      = 'Déposez votre fichier ici',
  hint,
}: FileDropzoneProps) {
  const inputRef             = useRef<HTMLInputElement>(null)
  const [state, setState]    = useState<DropState>('idle')
  const [error, setError]    = useState<string | null>(null)
  const [dropped, setDropped] = useState<File[]>([])

  const validate = useCallback((files: File[]): File[] | null => {
    const maxBytes = maxSizeMb * 1024 * 1024
    const acceptedExts = accept.split(',').map(s => s.trim().toLowerCase())

    const invalid = files.find(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return !acceptedExts.includes(ext)
    })
    if (invalid) {
      setError(`Format non accepté : ${invalid.name}`)
      return null
    }

    const tooBig = files.find(f => f.size > maxBytes)
    if (tooBig) {
      setError(`Fichier trop lourd (max ${maxSizeMb} Mo) : ${tooBig.name}`)
      return null
    }

    return files
  }, [accept, maxSizeMb])

  const handle = useCallback((files: File[]) => {
    setError(null)
    const valid = validate(files)
    if (!valid) { setState('error'); return }
    setState('idle')
    setDropped(prev => {
      const existing = new Set(prev.map(f => f.name))
      const next = [...prev, ...valid.filter(f => !existing.has(f.name))]
      onFiles(next)
      return next
    })
  }, [validate, onFiles])

  const onDragOver  = (e: DragEvent) => { e.preventDefault(); setState('hover') }
  const onDragLeave = ()             => setState('idle')
  const onDrop      = (e: DragEvent) => {
    e.preventDefault()
    handle(Array.from(e.dataTransfer.files))
  }
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handle(Array.from(e.target.files))
  }

  const removeFile = (name: string) => {
    setDropped(prev => {
      const next = prev.filter(f => f.name !== name)
      onFiles(next)
      return next
    })
    setError(null)
    setState('idle')
  }

  const borderColor = {
    idle:  'border-border-strong hover:border-accent/50',
    hover: 'border-accent shadow-[var(--shadow-glow)]',
    error: 'border-danger/60',
  }[state]

  const hint_ = hint ?? `Formats acceptés : ${accept} — max ${maxSizeMb} Mo`

  return (
    <div className="flex flex-col gap-3">

      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'relative flex flex-col items-center justify-center gap-3',
          'rounded-[var(--radius-lg)] border-2 border-dashed',
          'bg-surface cursor-pointer transition-all duration-200',
          'px-6 py-10 text-center select-none outline-none',
          'focus-visible:ring-2 focus-visible:ring-accent/60',
          borderColor,
        ].join(' ')}
      >
        <div className={[
          'w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center',
          'bg-accent/10 border border-accent/20',
          state === 'hover' && 'bg-accent/20 border-accent/40',
          state === 'error' && 'bg-danger/10 border-danger/30',
        ].join(' ')}>
          {state === 'error'
            ? <AlertCircle size={22} className="text-danger" />
            : <Upload size={22} className={state === 'hover' ? 'text-accent-hi' : 'text-accent'} />
          }
        </div>

        <div>
          <p className="text-text text-sm font-medium">{label}</p>
          <p className="text-muted text-xs mt-0.5">ou cliquez pour parcourir</p>
        </div>

        <p className="text-subtle text-xs">{hint_}</p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="sr-only"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30">
          <AlertCircle size={14} className="text-danger flex-shrink-0" />
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}

      {dropped.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {dropped.map(f => (
            <li key={f.name}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-elevated border border-border">
              <File size={14} className="text-accent flex-shrink-0" />
              <span className="text-text text-xs font-medium truncate flex-1">{f.name}</span>
              <span className="text-muted text-xs flex-shrink-0">
                {(f.size / 1024).toFixed(0)} Ko
              </span>
              <button
                onClick={e => { e.stopPropagation(); removeFile(f.name) }}
                className="text-subtle hover:text-danger transition-colors flex-shrink-0"
                aria-label={`Retirer ${f.name}`}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}
