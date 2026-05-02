import { useState } from 'react'
import type { Section } from '@/types/app'
import { SmallIconButton } from '@/components/ui/SmallIconButton'
import type { LayoutRow as LayoutRowType, CellContent } from '../types'
import { LayoutCell } from './LayoutCell'
import { ResizeDivider } from './ResizeDivider'

type Props = {
  row:              LayoutRowType
  displayH:         number
  canvasW:          number
  sections:         Section[]
  isLast:           boolean
  canRemove:        boolean
  onRemove:         () => void
  onSplitCell:      (cellId: string) => void
  onRemoveCell:     (cellId: string) => void
  onSetContent:     (cellId: string, content: CellContent) => void
  onUpdateCellFlex: (cellId: string, flex: number) => void
  onUpdateRowFlex:  (delta: number) => void
}

export function LayoutRow({
  row,
  displayH,
  canvasW,
  sections,
  isLast,
  canRemove,
  onRemove,
  onSplitCell,
  onRemoveCell,
  onSetContent,
  onUpdateCellFlex,
  onUpdateRowFlex,
}: Props) {
  const [hovered, setHovered] = useState(false)

  const totalFlex = row.cells.reduce((s, c) => s + c.flex, 0)

  const handleHorizontalResize = (leftIdx: number, delta: number) => {
    const leftCell  = row.cells[leftIdx]
    const rightCell = row.cells[leftIdx + 1]
    if (!leftCell || !rightCell) return

    const ratio     = delta / canvasW
    const flexDelta = ratio * totalFlex
    const newLeft   = Math.max(1, leftCell.flex + flexDelta)
    const newRight  = Math.max(1, rightCell.flex - flexDelta)

    onUpdateCellFlex(leftCell.id, newLeft)
    onUpdateCellFlex(rightCell.id, newRight)
  }

  return (
    <div style={{ flexShrink: 0 }}>
      {/* La ligne elle-même */}
      <div
        style={{ display: 'flex', flexDirection: 'row', height: displayH, position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Bouton supprimer la ligne (hover) */}
        {hovered && canRemove && (
          <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 30 }}>
            <SmallIconButton
              onClick={e => { e.stopPropagation(); onRemove() }}
              title="Supprimer la ligne"
              size={18}
              fontSize={9}
              color="var(--color-danger)"
            >
              ✕
            </SmallIconButton>
          </div>
        )}

        {row.cells.map((cell, idx) => (
          <div key={cell.id} style={{ display: 'flex', flex: cell.flex, minWidth: 0, position: 'relative' }}>
            <LayoutCell
              rowId={row.id}
              cell={cell}
              rowFlex={row.flex}
              sections={sections}
              canRemove={row.cells.length > 1}
              onSplit={() => onSplitCell(cell.id)}
              onRemove={() => onRemoveCell(cell.id)}
              onSetContent={content => onSetContent(cell.id, content)}
              onUpdateFlex={flex => onUpdateCellFlex(cell.id, flex)}
            />
            {idx < row.cells.length - 1 && (
              <ResizeDivider
                direction="horizontal"
                onResize={delta => handleHorizontalResize(idx, delta)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Divider vertical entre lignes */}
      {!isLast && (
        <ResizeDivider
          direction="vertical"
          onResize={onUpdateRowFlex}
        />
      )}
    </div>
  )
}
