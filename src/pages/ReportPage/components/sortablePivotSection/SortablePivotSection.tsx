import { useSortable }  from '@dnd-kit/sortable'
import { CSS }          from '@dnd-kit/utilities'

import { PivotSection } from '@/components/PivotSection'
import type { RawRow }            from '@/lib/loader'
import type { PivotConfig }       from '@/lib/pivot/types.ts'
import type { Section }           from '@/types/app.ts'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'

function toggleInArray(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(k => k !== item) : [...arr, item]
}

type SortablePivotSectionProps = {
  section:        Section
  headers:        string[]
  preview:        RawRow[]
  distinctValues: Record<string, string[]>
  onUpdate:       (patch: Partial<Section>) => void
  onCompute:      (config: PivotConfig) => void
  onCancel:       () => void
  onDelete:       () => void
}

export function SortablePivotSection({
  section, headers, preview, distinctValues,
  onUpdate, onCompute, onCancel, onDelete,
}: SortablePivotSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <PivotSection
        section={section}
        headers={headers}
        preview={preview}
        distinctValues={distinctValues}
        dragHandleAttrs={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
        onUpdate={onUpdate}
        onLabelChange={label => onUpdate({ label })}
        onToggleCollapse={() => onUpdate({ collapsed: !section.collapsed })}
        onConfigChange={(s: ConfiguratorState) => onUpdate({ configuratorState: s })}
        onCompute={onCompute}
        onCancel={onCancel}
        onDelete={onDelete}
        onToggleRowGroup={pk => onUpdate({ collapsedRowGroups: toggleInArray(section.collapsedRowGroups, pk) })}
        onToggleColGroup={pk => onUpdate({ collapsedColGroups: toggleInArray(section.collapsedColGroups, pk) })}
        onSetCollapsedRows={pks => onUpdate({ collapsedRowGroups: pks })}
        onSetCollapsedCols={pks => onUpdate({ collapsedColGroups: pks })}
      />
    </div>
  )
}
