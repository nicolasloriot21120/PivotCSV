import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ExportBlock } from '../types'
import { PDF_W, PDF_H, CANVAS_SCALE } from '../types'
import { DraggableBlock } from './DraggableBlock'

type Props = {
  blocks:        ExportBlock[]
  onUpdateBlock: (id: string, patch: Partial<ExportBlock>) => void
  onRemoveBlock: (id: string) => void
}

export function PdfCanvas({ blocks, onUpdateBlock, onRemoveBlock }: Props) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const block = blocks.find(b => b.id === active.id)
    if (!block) return
    onUpdateBlock(String(active.id), {
      x: block.x + delta.x / CANVAS_SCALE,
      y: block.y + delta.y / CANVAS_SCALE,
    })
  }

  return (
    <div style={{ overflow: 'auto', background: '#334155', padding: 24, display: 'flex', justifyContent: 'center' }}>
      <DndContext onDragEnd={handleDragEnd}>
        {/* Page A4 simulée */}
        <div
          style={{
            position:   'relative',
            background: 'white',
            width:      PDF_W * CANVAS_SCALE,
            height:     PDF_H * CANVAS_SCALE,
            boxShadow:  '0 4px 24px rgba(0,0,0,0.5)',
            flexShrink:  0,
          }}
        >
          {blocks.map(block => (
            <DraggableBlock
              key={block.id}
              block={block}
              scale={CANVAS_SCALE}
              onUpdate={patch => onUpdateBlock(block.id, patch)}
              onRemove={() => onRemoveBlock(block.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
