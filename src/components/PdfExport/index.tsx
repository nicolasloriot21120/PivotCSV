import { Download } from 'lucide-react'
import type { Section } from '@/types/app'
import { CloseButton }    from '@/components/ui/CloseButton'
import { ModalHeader }    from '@/components/ui/ModalHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { usePdfExport }   from './hooks/usePdfExport'
import { LayoutEditor }   from './components/LayoutEditor'

type Props = {
  sections: Section[]
  onClose:  () => void
}

export function PdfExportModal({ sections, onClose }: Props) {
  const {
    rows, generating, hasContent,
    addRow, removeRow, updateRowFlex,
    splitCell, removeCell, setCellContent, updateCellFlex,
    generate,
  } = usePdfExport(sections)

  return (
    <div
      style={{
        position:        'fixed',
        inset:           0,
        background:      'var(--color-modal-backdrop)',
        zIndex:          50,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background:    'var(--color-modal-bg)',
          borderRadius:  12,
          display:       'flex',
          flexDirection: 'column',
          width:         'min(95vw, 760px)',
          height:        'min(90vh, 960px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <ModalHeader
          height={40}
          left={<span style={{ color: 'var(--color-modal-text)', fontWeight: 600, fontSize: 14 }}>Export PDF</span>}
          right={<CloseButton onClick={onClose} />}
        />

        {/* Corps — LayoutEditor scrollable */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <LayoutEditor
            rows={rows}
            sections={sections}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            onUpdateRowFlex={updateRowFlex}
            onSplitCell={splitCell}
            onRemoveCell={removeCell}
            onSetContent={setCellContent}
            onUpdateCellFlex={updateCellFlex}
          />
        </div>

        {/* Pied de page */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'flex-end',
            padding:        '10px 16px',
            borderTop:      '1px solid var(--color-modal-border)',
            flexShrink:     0,
          }}
        >
          <button
            onClick={generating ? undefined : generate}
            disabled={!hasContent || generating}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              padding:      '7px 16px',
              borderRadius: 6,
              border:       'none',
              fontSize:     13,
              fontWeight:   500,
              cursor:       !hasContent || generating ? 'not-allowed' : 'pointer',
              background:   !hasContent || generating ? 'var(--color-modal-elevated)' : 'var(--color-accent)',
              color:        !hasContent || generating ? 'var(--color-modal-text-faint)' : 'var(--color-text)',
              transition:   'background 0.15s',
            }}
          >
            {generating ? <LoadingSpinner size={14} /> : <Download size={14} />}
            Générer PDF
          </button>
        </div>
      </div>
    </div>
  )
}
