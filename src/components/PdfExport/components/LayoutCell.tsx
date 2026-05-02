import { useState } from 'react'
import type { Section } from '@/types/app'
import { SmallIconButton } from '@/components/ui/SmallIconButton'
import type { LayoutCell as LayoutCellType, CellContent } from '../types'
import { CellPicker } from './CellPicker'

type Props = {
  rowId:        string
  cell:         LayoutCellType
  rowFlex:      number
  sections:     Section[]
  canRemove:    boolean
  onSplit:      () => void
  onRemove:     () => void
  onSetContent: (content: CellContent) => void
  onUpdateFlex: (flex: number) => void
}

export function LayoutCell({
  rowId,
  cell,
  rowFlex,
  sections,
  canRemove,
  onSplit,
  onRemove,
  onSetContent,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const { content } = cell

  const handleClear = () => onSetContent({ type: 'empty' })

  // Styles de fond selon le type de contenu
  const bgStyle = (() => {
    switch (content.type) {
      case 'empty':
        return {
          background:  'rgba(99,102,241,0.08)',
          border:      '1px dashed rgba(99,102,241,0.3)',
        }
      case 'table':
        return {
          background:  'rgba(59,130,246,0.06)',
          border:      '1px solid rgba(59,130,246,0.15)',
        }
      case 'chart':
        return {
          background:  'rgba(16,185,129,0.06)',
          border:      '1px solid rgba(16,185,129,0.15)',
        }
      case 'comment':
        return {
          background:  'rgba(245,158,11,0.06)',
          border:      '1px solid rgba(245,158,11,0.15)',
        }
    }
  })()

  return (
    <div
      data-cell-id={`${rowId}-${cell.id}`}
      style={{
        flex:       cell.flex,
        position:   'relative',
        overflow:   'hidden',
        display:    'flex',
        alignItems: 'stretch',
        minWidth:   0,
        ...bgStyle,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Contenu principal */}
      {content.type === 'empty' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <button
            onClick={() => setPickerOpen(true)}
            title="Ajouter du contenu"
            style={{
              width:        40,
              height:       40,
              borderRadius: '50%',
              background:   'rgba(99,102,241,0.2)',
              border:       '1px solid rgba(99,102,241,0.4)',
              color:        '#818cf8',
              fontSize:     22,
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              lineHeight:   1,
              transition:   'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.2)' }}
          >
            +
          </button>

          {pickerOpen && (
            <CellPicker
              sections={sections}
              onSelect={content => { onSetContent(content); setPickerOpen(false) }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      )}

      {(content.type === 'table' || content.type === 'chart') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '6px 8px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11 }}>{content.type === 'table' ? '📋' : '📊'}</span>
            <span style={{
              fontSize:    10,
              color:       '#64748b',
              overflow:    'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:  'nowrap',
            }}>
              {content.label} — {content.type === 'table' ? 'Tableau' : 'Graphique'}
            </span>
          </div>
        </div>
      )}

      {content.type === 'comment' && (
        <div style={{ flex: 1, display: 'flex', padding: 4 }}>
          <textarea
            value={content.text}
            onChange={e => onSetContent({ type: 'comment', text: e.target.value })}
            placeholder="Saisir un commentaire…"
            style={{
              flex:       1,
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
        </div>
      )}

      {/* Actions au hover */}
      {hovered && (
        <div
          style={{
            position:  'absolute',
            top:       4,
            right:     4,
            display:   'flex',
            gap:       2,
            zIndex:    20,
          }}
        >
          {/* Bouton split — toujours disponible */}
          <SmallIconButton
            onClick={e => { e.stopPropagation(); onSplit() }}
            title="Diviser la cellule"
          >
            ÷
          </SmallIconButton>

          {/* Bouton supprimer cellule — si pas seule + contenu vide */}
          {canRemove && content.type === 'empty' && (
            <SmallIconButton
              onClick={e => { e.stopPropagation(); onRemove() }}
              title="Supprimer la cellule"
              color="#ef4444"
            >
              ✕
            </SmallIconButton>
          )}

          {/* Bouton vider — si contenu non vide */}
          {content.type !== 'empty' && (
            <SmallIconButton
              onClick={e => { e.stopPropagation(); handleClear() }}
              title="Vider la cellule"
              color="#ef4444"
            >
              ✕
            </SmallIconButton>
          )}
        </div>
      )}
    </div>
  )
}
