import { PivotTable }       from '@/components/ui/PivotTable'
import { PivotChart }       from '@/components/ui/PivotChart'
import { CloseButton }      from '@/components/ui/CloseButton'
import { ModalHeader }      from '@/components/ui/ModalHeader'
import { NavigationButton } from '../navigationButton/NavigationButton.tsx'
import { usePresentationMode } from './usePresentationMode.ts'
import type { Section }     from '@/types/app.ts'

type Props = {
  sections: Section[]  // uniquement les sections avec result !== null
  onClose:  () => void
}

export function PresentationMode({ sections, onClose }: Props) {
  const ui = usePresentationMode(sections, onClose)
  if (!ui.section?.result || !ui.formatValue) return null

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'var(--color-modal-bg)',
      zIndex:         100,
      display:        'flex',
      flexDirection:  'column',
      overflow:       'hidden',
    }}>

      {/* ── Header ── */}
      <ModalHeader
        height={52}
        left={
          <span style={{ fontSize: 12, color: 'var(--color-modal-text-faint)', minWidth: 60 }}>
            {ui.sectionIndex + 1} / {ui.sectionsCount}
          </span>
        }
        center={
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-modal-text)' }}>
            {ui.section.label}
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

        <NavigationButton direction="prev" disabled={ui.isFirst} onClick={ui.prev} />

        <div style={{ flex: 1, display: 'flex', padding: '16px 60px', gap: 12, overflow: 'hidden' }}>

          {/* Tableau */}
          <div style={{ flex: ui.section.tableFlex, overflow: 'auto', minWidth: 0 }}>
            <PivotTable
              data={ui.section.result}
              showRowTotals={true}
              showColTotals={true}
              collapsedRowGroups={ui.collapsedRowGroups}
              collapsedColGroups={ui.collapsedColGroups}
              onToggleRowGroup={ui.toggleRowGroup}
              onToggleColGroup={ui.toggleColGroup}
              onSetCollapsedRows={ui.setCollapsedRows}
              onSetCollapsedCols={ui.setCollapsedCols}
              formatValue={ui.formatValue}
            />
          </div>

          <div style={{ width: 1, background: 'var(--color-modal-border)', flexShrink: 0 }} />

          {/* Graphique */}
          <div style={{ flex: ui.section.chartFlex, minWidth: 0, overflow: 'hidden' }}>
            <PivotChart
              data={ui.section.result}
              chartType={ui.section.chartType}
              collapsedRows={ui.collapsedRowGroups}
              collapsedCols={ui.collapsedColGroups}
              formatValue={ui.formatValue}
              chartColors={ui.section.chartColors}
              transpose={ui.section.chartTranspose}
            />
          </div>
        </div>

        <NavigationButton direction="next" disabled={ui.isLast} onClick={ui.next} />
      </div>

      <div style={{ height: 1, background: 'var(--color-modal-border)', flexShrink: 0 }} />

      {/* ── Notes ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '10px 24px 16px' }}>
        <label style={{
          fontSize:      11,
          color:         'var(--color-modal-text-faint)',
          fontWeight:    600,
          marginBottom:  6,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          flexShrink:    0,
        }}>
          Notes
        </label>
        <textarea
          value={ui.notes}
          onChange={e => ui.setNotes(e.target.value)}
          placeholder="Observations, commentaires…"
          style={{
            flex:         1,
            background:   'var(--color-modal-elevated)',
            border:       '1px solid var(--color-modal-border-strong)',
            borderRadius: 6,
            color:        'var(--color-modal-text)',
            fontSize:     13,
            padding:      '10px 12px',
            resize:       'none',
            outline:      'none',
            fontFamily:   'inherit',
            lineHeight:   1.6,
          }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)' }}
          onBlur={e =>  { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-modal-border-strong)' }}
        />
      </div>
    </div>
  )
}
