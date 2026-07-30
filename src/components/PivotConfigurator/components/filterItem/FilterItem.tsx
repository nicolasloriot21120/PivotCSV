import type { FilterField } from '../../types'
import { FieldChip } from '../fieldChip/FieldChip'
import { StringFilterValues } from './components/stringFilterValues/StringFilterValues'
import { NumberFilterRange }  from './components/numberFilterRange/NumberFilterRange'

type Props = {
  field:    FilterField
  onRemove: () => void
  onUpdate: (patch: Partial<FilterField>) => void
}

export function FilterItem({ field, onRemove, onUpdate }: Props) {
  return (
    <FieldChip
      field={field.field}
      type={field.type}
      draggableId={`filters::${field.field}`}
      onRemove={onRemove}
    >
      {field.type === 'string' || field.type === 'date' ? (
        <StringFilterValues
          distinctValues={field.distinctValues ?? []}
          selectedValues={field.selectedValues ?? []}
          onUpdate={onUpdate}
        />
      ) : (
        <NumberFilterRange
          min={field.min}
          max={field.max}
          onUpdate={onUpdate}
        />
      )}
    </FieldChip>
  )
}
