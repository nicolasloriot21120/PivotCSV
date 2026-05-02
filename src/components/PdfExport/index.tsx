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
        background:      'rgba(0,0,0,0.70)',
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
          background:    '#0f172a',
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
          left={<span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>Export PDF</span>}
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
            borderTop:      '1px solid #1e293b',
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
              background:   !hasContent || generating ? '#1e293b' : '#2563eb',
              color:        !hasContent || generating ? '#475569' : 'white',
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
