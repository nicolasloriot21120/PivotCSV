import { Rows3, Columns3 } from 'lucide-react'
import type { DateGrouping } from '@/lib/pivot/dateGroup'
import type { PlacedField } from '../../types'
import { DropZone } from '../dropZone/DropZone'
import { FieldChip } from '../fieldChip/FieldChip'
import { DateGroupPicker } from '../dateGroupPicker/DateGroupPicker'
import styles from './DimensionDropZone.module.css'

const DIM_CONFIG = {
  rows:    { label: 'Lignes',   icon: <Rows3    size={12} /> },
  columns: { label: 'Colonnes', icon: <Columns3 size={12} /> },
} as const

export type DimensionDropZoneProps = {
  dim:                'rows' | 'columns'
  fields:             PlacedField[]
  onRemove:           (field: string) => void
  onDateGroupChange:  (field: string, g: DateGrouping | undefined) => void
}

export function DimensionDropZone({ dim, fields, onRemove, onDateGroupChange }: DimensionDropZoneProps) {
  const { label, icon } = DIM_CONFIG[dim]

  return (
    <DropZone id={dim} label={label} icon={icon} placeholder="Glissez un champ ici">
      {fields.map(f => (
        <div key={f.field} className={styles.zoneItem}>
          <FieldChip
            field={f.field}
            type={f.type}
            draggableId={`${dim}::${f.field}`}
            onRemove={() => onRemove(f.field)}
          />
          {f.type === 'date' && (
            <DateGroupPicker
              value={f.dateGroup}
              onChange={g => onDateGroupChange(f.field, g)}
            />
          )}
        </div>
      ))}
    </DropZone>
  )
}
