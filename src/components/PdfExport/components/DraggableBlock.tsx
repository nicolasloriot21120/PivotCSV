import { useDraggable } from '@dnd-kit/core'
import type { ExportBlock } from '../types'

type Props = {
  block:    ExportBlock
  scale:    number
  onUpdate: (patch: Partial<ExportBlock>) => void
  onRemove: () => void
}

export function DraggableBlock({ block, scale, onUpdate, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform } = useDraggable({
    id: block.id,
  })

  const transformStyle = transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left:      block.x * scale,
        top:       block.y * scale,
        width:     block.width * scale,
        height:    block.height * scale,
        transform: transformStyle,
        background:   '#1e293b',
        border:       '1px solid #334155',
        borderRadius: 4,
        display:      'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}
      {...attributes}
    >
      {/* En-tête draggable */}
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '4px 8px',
          background:     '#0f172a',
          borderBottom:   '1px solid #334155',
          cursor:         'grab',
          flexShrink:     0,
          userSelect:     'none',
        }}
      >
        <span style={{
          fontSize:     11,
          color:        '#94a3b8',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          flex:         1,
        }}>
          {block.label}
        </span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onRemove}
          style={{
            background: 'transparent',
            border:     'none',
            color:      '#ef4444',
            cursor:     'pointer',
            padding:    '0 0 0 6px',
            fontSize:   14,
            lineHeight:  1,
            flexShrink:  0,
          }}
          title="Supprimer"
        >
          ✕
        </button>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
        {block.type === 'comment' ? (
          <textarea
            value={block.comment ?? ''}
            onChange={e => onUpdate({ comment: e.target.value })}
            onPointerDown={e => e.stopPropagation()}
            placeholder="Saisir un commentaire…"
            style={{
              width:      '100%',
              height:     '100%',
              resize:     'none',
              background: 'transparent',
              border:     'none',
              outline:    'none',
              color:      '#cbd5e1',
              fontSize:   11,
              fontFamily: 'inherit',
              padding:    4,
            }}
          />
        ) : (
          <span style={{ fontSize: 20, color: '#64748b' }}>
            {block.type === 'table' ? '📋 Tableau' : '📊 Graphique'}
          </span>
        )}
      </div>
    </div>
  )
}
