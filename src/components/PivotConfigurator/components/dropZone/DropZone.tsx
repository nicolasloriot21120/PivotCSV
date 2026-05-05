import { useDroppable }          from '@dnd-kit/core'
import type { ReactNode }        from 'react'
import type { ZoneId }           from '../../types'
import styles                    from './DropZone.module.css'

type Props = {
  id:          ZoneId
  label:       string
  icon:        ReactNode
  children:    ReactNode
  isOver?:     boolean
  placeholder: string
}

export function DropZone({ id, label, icon, children, placeholder }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>

      <div
        ref={setNodeRef}
        className={isOver ? styles.areaActive : styles.areaIdle}
      >
        {children ?? (
          <p className={styles.placeholder}>
            {placeholder}
          </p>
        )}
      </div>
    </div>
  )
}
