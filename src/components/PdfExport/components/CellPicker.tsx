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
        background:   '#0f172a',
        border:       '1px solid #334155',
        borderRadius: 8,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
        zIndex:       100,
        minWidth:     240,
        maxWidth:     300,
        overflow:     'hidden',
      }}
    >
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Ajouter du contenu
        </span>
      </div>

      <div style={{ padding: '6px 0', maxHeight: 320, overflowY: 'auto' }}>
        {availableSections.length === 0 && (
          <p style={{ fontSize: 11, color: '#475569', padding: '8px 12px' }}>
            Aucune section avec des données disponibles.
          </p>
        )}

        {availableSections.map(section => (
          <div key={section.id}>
            <div style={{ padding: '4px 12px', fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                color:      '#cbd5e1',
                fontSize:   12,
                cursor:     'pointer',
                textAlign:  'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1e293b' }}
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
                color:      '#cbd5e1',
                fontSize:   12,
                cursor:     'pointer',
                textAlign:  'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1e293b' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span>📊</span>
              <span>Graphique</span>
            </button>
          </div>
        ))}

        {availableSections.length > 0 && (
          <div style={{ borderTop: '1px solid #1e293b', margin: '4px 0' }} />
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
            color:      '#cbd5e1',
            fontSize:   12,
            cursor:     'pointer',
            textAlign:  'left',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1e293b' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <span>✏️</span>
          <span>Zone de texte</span>
        </button>
      </div>
    </div>
  )
}
