import { useRef, useState, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Upload, File, X, AlertCircle, Plus } from 'lucide-react'
import styles from './styles.module.css'

export type FileDropzoneProps = {
  accept?:        string
  multiple?:      boolean
  maxSizeMb?:     number
  onFiles:        (files: File[]) => void
  onFileSelect?:  (file: File) => void
  onAddPivot?:    (file: File) => void
  selectedFile?:  File
  label?:         string
  hint?:          string
  hideList?:      boolean
}

type DropState = 'idle' | 'hover' | 'error'

export function FileDropzone({
  accept        = '.csv',
  multiple      = false,
  maxSizeMb     = 10,
  onFiles,
  onFileSelect,
  onAddPivot,
  selectedFile,
  label         = 'Déposez votre fichier ici',
  hint,
  hideList      = false,
}: FileDropzoneProps) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [state, setState]     = useState<DropState>('idle')
  const [error, setError]     = useState<string | null>(null)
  const [dropped, setDropped] = useState<File[]>([])

  const validate = useCallback((files: File[]): File[] | null => {
    const maxBytes     = maxSizeMb * 1024 * 1024
    const acceptedExts = accept.split(',').map(s => s.trim().toLowerCase())

    const invalid = files.find(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return !acceptedExts.includes(ext)
    })
    if (invalid) { setError(`Format non accepté : ${invalid.name}`); return null }

    const tooBig = files.find(f => f.size > maxBytes)
    if (tooBig) { setError(`Fichier trop lourd (max ${maxSizeMb} Mo) : ${tooBig.name}`); return null }

    return files
  }, [accept, maxSizeMb])

  const handle = useCallback((files: File[]) => {
    setError(null)
    const valid = validate(files)
    if (!valid) { setState('error'); return }
    setState('idle')
    const existing = new Set(dropped.map(f => f.name))
    const newFiles = valid.filter(f => !existing.has(f.name))
    const next     = [...dropped, ...newFiles]
    setDropped(next)
    onFiles(next)
    onFileSelect?.(valid[0])
  }, [validate, onFiles, onFileSelect, dropped])

  const onDragOver  = (e: DragEvent) => { e.preventDefault(); setState('hover') }
  const onDragLeave = ()             => setState('idle')
  const onDrop      = (e: DragEvent) => { e.preventDefault(); handle(Array.from(e.dataTransfer.files)) }
  const onChange    = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) handle(Array.from(e.target.files)) }

  const removeFile = (name: string) => {
    const next = dropped.filter(f => f.name !== name)
    setDropped(next)
    onFiles(next)
    if (selectedFile?.name === name) onFileSelect?.(next[0])
    setError(null)
    setState('idle')
  }

  const hint_ = hint ?? `Formats acceptés : ${accept} — max ${maxSizeMb} Mo`

  return (
    <div className={styles.root}>

      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-state={state}
        className={styles.dropzone}
      >
        <div className={styles.iconBox}>
          {state === 'error'
            ? <AlertCircle size={22} className={styles.icon} />
            : <Upload size={22} className={styles.icon} />
          }
        </div>

        <div>
          <p className={styles.label}>{label}</p>
          <p className={styles.sublabel}>ou cliquez pour parcourir</p>
        </div>

        <p className={styles.hint}>{hint_}</p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className={styles.hiddenInput}
        />
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={14} className={styles.errorIcon} />
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {!hideList && dropped.length > 0 && (
        <ul className={styles.fileList}>
          {dropped.map(f => {
            const isSelected = selectedFile?.name === f.name
            return (
              <li
                key={f.name}
                onClick={() => onFileSelect?.(f)}
                data-selected={isSelected || undefined}
                className={styles.fileItem}
              >
                <File size={14} className={styles.fileIcon} />
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileSize}>
                  {(f.size / 1024).toFixed(0)} Ko
                </span>
                {onAddPivot && (
                  <button
                    onClick={e => { e.stopPropagation(); onAddPivot(f) }}
                    className={styles.fileActionAdd}
                    aria-label={`Nouveau pivot pour ${f.name}`}
                    title="Ajouter un pivot"
                  >
                    <Plus size={13} />
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removeFile(f.name) }}
                  className={styles.fileActionRemove}
                  aria-label={`Retirer ${f.name}`}
                >
                  <X size={13} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

    </div>
  )
}
