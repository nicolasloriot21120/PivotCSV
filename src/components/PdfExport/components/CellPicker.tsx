import { useEffect, useRef } from 'react'
import type { Section } from '@/types/app'
import type { CellContent } from '../types'

type Props = {
  sections: Section[]
  onSelect: (content: CellContent) => void
  onClose:  () => void
}

export function CellPicker({ sections, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const availableSections = sections.filter(s => s.result !== null)

  return (
    <div
      ref={ref}
      style={{
        position:     'absolute',
        top:          '50%',
        left:         '50%',
        transform:    'translate(-50%, -50%)',
        background:   'var(--color-modal-bg)',
        border:       '1px solid var(--color-modal-border-strong)',
        borderRadius: 8,
        boxShadow:    'var(--shadow-elevated)',
        zIndex:       100,
        minWidth:     240,
        maxWidth:     300,
        overflow:     'hidden',
      }}
    >
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-modal-border)' }}>
        <span style={{ fontSize: 11, color: 'var(--color-modal-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Ajouter du contenu
        </span>
      </div>

      <div style={{ padding: '6px 0', maxHeight: 320, overflowY: 'auto' }}>
        {availableSections.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--color-modal-text-faint)', padding: '8px 12px' }}>
            Aucune section avec des données disponibles.
          </p>
        )}

        {availableSections.map(section => (
          <div key={section.id}>
            <div style={{ padding: '4px 12px', fontSize: 10, color: 'var(--color-modal-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {section.label}
            </div>
            <button
              onClick={() => onSelect({ type: 'table', sectionId: section.id, label: section.label })}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        8,
                width:      '100%',
                padding:    '6px 16px',
                background: 'transparent',
                border:     'none',
                color:      'var(--color-modal-text-strong)',
                fontSize:   12,
                cursor:     'pointer',
                textAlign:  'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-modal-elevated)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span>📋</span>
              <span>Tableau</span>
            </button>
            <button
              onClick={() => onSelect({ type: 'chart', sectionId: section.id, label: section.label })}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        8,
                width:      '100%',
                padding:    '6px 16px',
                background: 'transparent',
                border:     'none',
                color:      'var(--color-modal-text-strong)',
                fontSize:   12,
                cursor:     'pointer',
                textAlign:  'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-modal-elevated)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span>📊</span>
              <span>Graphique</span>
            </button>
          </div>
        ))}

        {availableSections.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-modal-border)', margin: '4px 0' }} />
        )}

        <button
          onClick={() => onSelect({ type: 'comment', text: '' })}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
            width:      '100%',
            padding:    '6px 16px',
            background: 'transparent',
            border:     'none',
            color:      'var(--color-modal-text-strong)',
            fontSize:   12,
            cursor:     'pointer',
            textAlign:  'left',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-modal-elevated)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <span>✏️</span>
          <span>Zone de texte</span>
        </button>
      </div>
    </div>
  )
}
