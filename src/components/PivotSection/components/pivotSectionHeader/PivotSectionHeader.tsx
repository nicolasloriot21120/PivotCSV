import { useSortable }             from '@dnd-kit/sortable'
import type { DraggableAttributes } from '@dnd-kit/core'
type SortableListeners = ReturnType<typeof useSortable>['listeners']

import { GripVertical, ChevronDown, ChevronRight, X, FileText } from 'lucide-react'
import type { Section } from '@/types/app'
import { EditableLabel } from '../editableLabel/EditableLabel'
import shared from '@/styles/shared.module.css'
import styles from './PivotSectionHeader.module.css'

const STATUS_DOT_CLASS: Record<Section['status'], string | null> = {
  idle:      null,
  computing: styles.statusDotComputing,
  done:      styles.statusDotDone,
  error:     styles.statusDotError,
}

export type PivotSectionHeaderProps = {
  label:               string
  fileName:            string
  status:              Section['status']
  collapsed:           boolean
  editingLabel:        boolean
  dragHandleAttrs:     DraggableAttributes
  dragHandleListeners: SortableListeners
  onEditingLabelChange: (v: boolean) => void
  onLabelChange:       (label: string) => void
  onToggleCollapse:    () => void
  onDelete:            () => void
}

export function PivotSectionHeader({
  label, fileName, status, collapsed,
  editingLabel, dragHandleAttrs, dragHandleListeners,
  onEditingLabelChange, onLabelChange, onToggleCollapse, onDelete,
}: PivotSectionHeaderProps) {
  const statusDotClass = STATUS_DOT_CLASS[status]

  return (
    <div className={styles.headerBar}>
      <button
        {...dragHandleAttrs}
        {...dragHandleListeners}
        className={shared.dragHandle}
      >
        <GripVertical size={15} />
      </button>

      <FileText size={13} className={styles.fileIcon} />

      <EditableLabel
        value={label}
        editing={editingLabel}
        onChange={onLabelChange}
        onStartEdit={() => onEditingLabelChange(true)}
        onStopEdit={() => onEditingLabelChange(false)}
      />

      <span className={styles.fileName}>{fileName}</span>

      {statusDotClass && <span className={statusDotClass} />}

      <div className={styles.headerActions}>
        <button
          onClick={onToggleCollapse}
          className={styles.iconButtonNeutral}
          title={collapsed ? 'Déplier' : 'Replier'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={onDelete}
          className={styles.iconButtonDanger}
          title="Supprimer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
