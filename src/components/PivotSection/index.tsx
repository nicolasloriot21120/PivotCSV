import { useState }             from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListeners } from '@dnd-kit/core/dist/hooks/utilities'
import {
  GripVertical, ChevronDown, ChevronRight,
  Settings2, X, FileText,
} from 'lucide-react'
import { PivotConfigurator }    from '@/components/PivotConfigurator'
import type { Section }         from '@/types/app'
import type { RawRow }          from '@/lib/loader'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'

type Props = {
  section:             Section
  headers:             string[]
  preview:             RawRow[]
  dragHandleAttrs:     DraggableAttributes
  dragHandleListeners: SyntheticListeners
  isDragging:          boolean
  onLabelChange:       (label: string) => void
  onToggleCollapse:    () => void
  onToggleConfigurator:() => void
  onConfigChange:      (state: ConfiguratorState) => void
  onCompute:           (config: PivotConfig) => void
  onCancel:            () => void
  onDelete:            () => void
}

export function PivotSection({
  section, headers, preview,
  dragHandleAttrs, dragHandleListeners, isDragging,
  onLabelChange, onToggleCollapse, onToggleConfigurator,
  onConfigChange, onCompute, onCancel, onDelete,
}: Props) {
  const [editingLabel, setEditingLabel] = useState(false)

  return (
    <div
      className={[
        'rounded-[var(--radius-lg)] border border-border bg-surface',
        'transition-all duration-200',
        isDragging ? 'shadow-[var(--shadow-elevated)] opacity-80' : 'shadow-[var(--shadow-card)]',
      ].join(' ')}
    >
      {/* Header de section */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">

        {/* Poignée de drag */}
        <button
          {...dragHandleAttrs}
          {...dragHandleListeners}
          className="text-subtle hover:text-muted cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        >
          <GripVertical size={15} />
        </button>

        {/* Icône fichier source */}
        <FileText size={13} className="text-accent/60 flex-shrink-0" />

        {/* Titre éditable */}
        {editingLabel ? (
          <input
            autoFocus
            value={section.label}
            onChange={e => onLabelChange(e.target.value)}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false) }}
            className={[
              'flex-1 bg-transparent border-b border-accent/50 outline-none',
              'text-sm font-semibold text-text px-0.5',
            ].join(' ')}
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-text cursor-text truncate"
            onDoubleClick={() => setEditingLabel(true)}
            title="Double-cliquer pour renommer"
          >
            {section.label}
          </span>
        )}

        <span className="text-[10px] text-subtle truncate max-w-[120px] flex-shrink-0 hidden sm:block">
          {section.fileName}
        </span>

        {/* Statut */}
        {section.status === 'done' && (
          <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
        )}
        {section.status === 'computing' && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
        )}
        {section.status === 'error' && (
          <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
        )}

        {/* Contrôles */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleConfigurator}
            title="Configurateur"
            className={[
              'flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)]',
              'text-[11px] font-medium transition-all duration-150',
              section.configuratorOpen
                ? 'bg-accent/10 text-accent-hi'
                : 'text-subtle hover:text-text hover:bg-elevated',
            ].join(' ')}
          >
            <Settings2 size={12} />
            <span className="hidden sm:inline">Config</span>
          </button>

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-subtle hover:text-text hover:bg-elevated transition-all duration-150"
            title={section.collapsed ? 'Déplier' : 'Replier'}
          >
            {section.collapsed
              ? <ChevronRight size={14} />
              : <ChevronDown size={14} />
            }
          </button>

          <button
            onClick={onDelete}
            className="p-1 rounded text-subtle hover:text-danger hover:bg-danger/10 transition-all duration-150"
            title="Supprimer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Corps — masqué si replié */}
      {!section.collapsed && (
        <div className="flex flex-col">

          {/* Configurateur */}
          {section.configuratorOpen && (
            <div className="px-5 py-4 border-b border-border bg-elevated/30">
              <PivotConfigurator
                value={section.configuratorState}
                onChange={onConfigChange}
                headers={headers}
                preview={preview}
                status={section.status}
                progress={section.progress}
                onCompute={onCompute}
                onCancel={onCancel}
              />
            </div>
          )}

          {/* Résultats */}
          <div className="px-5 py-4">
            {section.result ? (
              <p className="text-xs text-muted">
                Tableau : {section.result.rowKeys.length} ligne(s) × {section.result.colKeys.length} colonne(s)
                {/* Le composant PivotTable sera câblé ici */}
              </p>
            ) : (
              <p className="text-xs text-subtle italic">
                {section.status === 'idle'
                  ? 'Configurez le pivot puis cliquez sur Calculer.'
                  : section.status === 'error'
                    ? 'Une erreur est survenue lors du calcul.'
                    : null
                }
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
