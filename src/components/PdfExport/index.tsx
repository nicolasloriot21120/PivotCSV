import { Download } from 'lucide-react'
import type { Section } from '@/types/app'
import { usePdfExport } from './hooks/usePdfExport'
import { BlockSelector } from './components/BlockSelector'
import { PdfCanvas } from './components/PdfCanvas'

type Props = {
  sections: Section[]
  onClose:  () => void
}

export function PdfExportModal({ sections, onClose }: Props) {
  const {
    blocks, generating,
    toggleBlock, addComment, updateBlock, removeBlock, isSelected, generate,
  } = usePdfExport(sections)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.70)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background:    '#0f172a',
          borderRadius:  12,
          display:       'flex',
          flexDirection: 'column',
          width:         'min(95vw, 1100px)',
          height:        'min(90vh, 900px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 flex-shrink-0">
          <span className="text-white font-semibold text-sm">Export PDF</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg leading-none"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps */}
        <div className="flex flex-row flex-1 overflow-hidden">
          {/* Panneau gauche — sélection des blocs */}
          <div
            className="border-r border-slate-700 overflow-y-auto p-4 flex-shrink-0"
            style={{ width: 256 }}
          >
            <BlockSelector
              sections={sections}
              isSelected={isSelected}
              onToggle={toggleBlock}
              onAddComment={addComment}
            />
          </div>

          {/* Zone centrale — canvas A4 */}
          <div className="flex-1 overflow-auto">
            <PdfCanvas
              blocks={blocks}
              onUpdateBlock={updateBlock}
              onRemoveBlock={removeBlock}
            />
          </div>
        </div>

        {/* Pied de page */}
        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400">
            {blocks.length} bloc{blocks.length > 1 ? 's' : ''} sélectionné{blocks.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={generate}
            disabled={blocks.length === 0 || generating}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all',
              blocks.length === 0 || generating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500',
            ].join(' ')}
          >
            {generating ? (
              <span
                className="animate-spin"
                style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}
              />
            ) : (
              <Download size={14} />
            )}
            Générer PDF
          </button>
        </div>
      </div>
    </div>
  )
}
