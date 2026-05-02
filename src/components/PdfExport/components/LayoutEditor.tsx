import type { Section } from '@/types/app'
import type { LayoutRow as LayoutRowType, CellContent } from '../types'
import { CANVAS_W, CANVAS_H } from '../types'
import { LayoutRow } from './LayoutRow'

type Props = {
  rows:             LayoutRowType[]
  sections:         Section[]
  onAddRow:         () => void
  onRemoveRow:      (rowId: string) => void
  onUpdateRowFlex:  (rowId: string, flex: number) => void
  onSplitCell:      (rowId: string, cellId: string) => void
  onRemoveCell:     (rowId: string, cellId: string) => void
  onSetContent:     (rowId: string, cellId: string, content: CellContent) => void
  onUpdateCellFlex: (rowId: string, cellId: string, flex: number) => void
}

export function LayoutEditor({
  rows,
  sections,
  onAddRow,
  onRemoveRow,
  onUpdateRowFlex,
  onSplitCell,
  onRemoveCell,
  onSetContent,
  onUpdateCellFlex,
}: Props) {
  const totalFlex = rows.reduce((s, r) => s + r.flex, 0)

  return (
    <div
      style={{
        background: 'var(--color-canvas-bg)',
        padding:    24,
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight:  '100%',
      }}
    >
      {/* Page A4 simulée */}
      <div
        style={{
          background:   'var(--color-paper)',
          width:        CANVAS_W,
          minHeight:    CANVAS_H,
          boxShadow:    'var(--shadow-elevated)',
          overflow:     'hidden',
          flexShrink:   0,
          display:      'flex',
          flexDirection: 'column',
        }}
      >
        {rows.map((row, idx) => {
          const displayH = Math.round((row.flex / totalFlex) * CANVAS_H)
          return (
            <LayoutRow
              key={row.id}
              row={row}
              displayH={displayH}
              canvasW={CANVAS_W}
              sections={sections}
              isLast={idx === rows.length - 1}
              canRemove={rows.length > 1}
              onRemove={() => onRemoveRow(row.id)}
              onSplitCell={cellId => onSplitCell(row.id, cellId)}
              onRemoveCell={cellId => onRemoveCell(row.id, cellId)}
              onSetContent={(cellId, content) => onSetContent(row.id, cellId, content)}
              onUpdateCellFlex={(cellId, flex) => onUpdateCellFlex(row.id, cellId, flex)}
              onUpdateRowFlex={delta => {
                // Convertit le delta en pixels en delta flex
                const flexPerPx = totalFlex / CANVAS_H
                onUpdateRowFlex(row.id, row.flex + delta * flexPerPx)
              }}
            />
          )
        })}
      </div>

      {/* Bouton ajouter une ligne */}
      <button
        onClick={onAddRow}
        style={{
          marginTop:    12,
          padding:      '6px 16px',
          background:   'var(--color-accent-bg-soft)',
          border:       '1px dashed var(--color-accent-border)',
          borderRadius: 6,
          color:        'var(--color-accent-hi)',
          fontSize:     12,
          cursor:       'pointer',
          transition:   'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-bg)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-bg-soft)' }}
      >
        + Ajouter une ligne
      </button>
    </div>
  )
}
