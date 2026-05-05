import { useDroppable } from '@dnd-kit/core'
import { Filter }       from 'lucide-react'
import type { FilterField } from '../../types'
import { FilterItem }       from '../filterItem/FilterItem'
import styles               from './FilterZone.module.css'

type Props = {
  filters:  FilterField[]
  onRemove: (field: string) => void
  onUpdate: (field: string, patch: Partial<FilterField>) => void
}

export function FilterZone({ filters, onRemove, onUpdate }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'filters' })

  const isEmpty = filters.length === 0
  const areaClass = isOver
    ? (isEmpty ? styles.areaActiveEmpty : styles.areaActive)
    : (isEmpty ? styles.areaIdleEmpty   : styles.areaIdle)

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <Filter size={12} className={styles.icon} />
        <span className={styles.label}>Filtres</span>
        <span className={styles.hint}>(appliqués avant agrégation)</span>
      </div>

      <div ref={setNodeRef} className={areaClass}>
        {isEmpty && (
          <p className={styles.placeholder}>
            Glissez un champ ici pour filtrer
          </p>
        )}
        {filters.map(f => (
          <FilterItem
            key={f.field}
            field={f}
            onRemove={() => onRemove(f.field)}
            onUpdate={patch => onUpdate(f.field, patch)}
          />
        ))}
      </div>
    </div>
  )
}
