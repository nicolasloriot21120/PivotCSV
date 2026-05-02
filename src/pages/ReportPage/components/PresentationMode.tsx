import { useState, useEffect, useCallback } from 'react'
import { PivotTable }  from '@/components/ui/PivotTable'
import { PivotChart }  from '@/components/ui/PivotChart'
import { CloseButton } from '@/components/ui/CloseButton'
import { ModalHeader } from '@/components/ui/ModalHeader'
import { NavigationButton } from './NavigationButton'
import { makeFormatter } from '@/lib/pivot/format'
import type { Section } from '@/types/app'

type Props = {
  sections: Section[]  // uniquement les sections avec result !== null
  onClose:  () => void
}

export function PresentationMode({ sections, onClose }: Props) {
  const [index,   setIndex]   = useState(0)
  const [notes,   setNotes]   = useState<Record<string, string>>({})
  const [cRows,   setCRows]   = useState<Record<string, string[]>>({})
  const [cCols,   setCCols]   = useState<Record<string, string[]>>({})

  // Initialise les états collapsed depuis les sections
  useEffect(() => {
    setCRows(Object.fromEntries(sections.map(s => [s.id, s.collapsedRowGroups])))
    setCCols(Object.fromEntries(sections.map(s => [s.id, s.collapsedColGroups])))
  }, [sections])

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex(i => Math.min(sections.length - 1, i + 1)), [sections.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  const section = sections[index]
  if (!section?.result) return null

  const formatValue        = makeFormatter(section.valueScale, section.valueDecimals)
  const collapsedRowGroups = cRows[section.id] ?? section.collapsedRowGroups
  const collapsedColGroups = cCols[section.id] ?? section.collapsedColGroups

  const isFirst = index === 0
  const isLast  = index === sections.length - 1

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     '#0f172a',
      zIndex:         100,
      display:        'flex',
      flexDirection:  'column',
      overflow:       'hidden',
    }}>

      {/* ── Header ── */}
      <ModalHeader
        height={52}
        left={
          <span style={{ fontSize: 12, color: '#475569', minWidth: 60 }}>
            {index + 1} / {sections.length}
          </span>
        }
        center={
          <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>
            {section.label}
          </span>
        }
        right={
          <div style={{ minWidth: 60, display: 'flex', justifyContent: 'flex-end' }}>
            <CloseButton onClick={onClose} title="Fermer (Esc)" colorIdle="var(--color-modal-text-faint)" />
          </div>
        }
      />

      {/* ── Tableau + Graphique ── */}
      <div style={{ flex: 3, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>

        <NavigationButton direction="prev" disabled={isFirst} onClick={prev} />

        <div style={{ flex: 1, display: 'flex', padding: '16px 60px', gap: 12, overflow: 'hidden' }}>

          {/* Tableau */}
          <div style={{ flex: section.tableFlex, overflow: 'auto', minWidth: 0 }}>
            <PivotTable
              data={section.result}
              showRowTotals={true}
              showColTotals={true}
              collapsedRowGroups={collapsedRowGroups}
              collapsedColGroups={collapsedColGroups}
              onToggleRowGroup={pk => setCRows(r => ({
                ...r,
                [section.id]: collapsedRowGroups.includes(pk)
                  ? collapsedRowGroups.filter(x => x !== pk)
                  : [...collapsedRowGroups, pk],
              }))}
              onToggleColGroup={pk => setCCols(r => ({
                ...r,
                [section.id]: collapsedColGroups.includes(pk)
                  ? collapsedColGroups.filter(x => x !== pk)
                  : [...collapsedColGroups, pk],
              }))}
              onSetCollapsedRows={pks => setCRows(r => ({ ...r, [section.id]: pks }))}
              onSetCollapsedCols={pks => setCCols(r => ({ ...r, [section.id]: pks }))}
              formatValue={formatValue}
            />
          </div>

          <div style={{ width: 1, background: '#1e293b', flexShrink: 0 }} />

          {/* Graphique */}
          <div style={{ flex: section.chartFlex, minWidth: 0, overflow: 'hidden' }}>
            <PivotChart
              data={section.result}
              chartType={section.chartType}
              collapsedRows={collapsedRowGroups}
              collapsedCols={collapsedColGroups}
              formatValue={formatValue}
              chartColors={section.chartColors}
              transpose={section.chartTranspose}
            />
          </div>
        </div>

        <NavigationButton direction="next" disabled={isLast} onClick={next} />
      </div>

      <div style={{ height: 1, background: '#1e293b', flexShrink: 0 }} />

      {/* ── Notes ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '10px 24px 16px' }}>
        <label style={{
          fontSize:        11,
          color:           '#475569',
          fontWeight:      600,
          marginBottom:    6,
          textTransform:   'uppercase',
          letterSpacing:   '0.05em',
          flexShrink:      0,
        }}>
          Notes
        </label>
        <textarea
          value={notes[section.id] ?? ''}
          onChange={e => setNotes(n => ({ ...n, [section.id]: e.target.value }))}
          placeholder="Observations, commentaires…"
          style={{
            flex:        1,
            background:  '#1e293b',
            border:      '1px solid #334155',
            borderRadius: 6,
            color:       '#e2e8f0',
            fontSize:    13,
            padding:     '10px 12px',
            resize:      'none',
            outline:     'none',
            fontFamily:  'inherit',
            lineHeight:  1.6,
          }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1' }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = '#334155' }}
        />
      </div>
    </div>
  )
}
