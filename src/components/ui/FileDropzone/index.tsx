import { Upload, File, X, AlertCircle, Plus } from 'lucide-react'
import { useFileDropzone } from './hooks/useFileDropzone'
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
  const { inputRef, state, error, dropped, onDragOver, onDragLeave, onDrop, onChange, removeFile } =
    useFileDropzone({ accept, multiple, maxSizeMb, onFiles, onFileSelect, selectedFile })

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
