import styles from './EditableLabel.module.css'

export type EditableLabelProps = {
  value:        string
  editing:      boolean
  onChange:     (val: string) => void
  onStartEdit:  () => void
  onStopEdit:   () => void
}

export function EditableLabel({ value, editing, onChange, onStartEdit, onStopEdit }: EditableLabelProps) {
  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onStopEdit}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onStopEdit() }}
        className={styles.labelInput}
      />
    )
  }

  return (
    <span
      className={styles.labelText}
      onDoubleClick={onStartEdit}
      title="Double-cliquer pour renommer"
    >
      {value}
    </span>
  )
}
