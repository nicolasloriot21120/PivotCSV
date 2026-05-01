import { useState, useEffect }  from 'react'
import { useSortable }           from '@dnd-kit/sortable'
import type { DraggableAttributes } from '@dnd-kit/core'
type SortableListeners = ReturnType<typeof useSortable>['listeners']

import {
  GripVertical, ChevronDown, ChevronRight,
  X, FileText, AlertCircle,
} from 'lucide-react'

import { PivotConfigurator }    from '@/components/PivotConfigurator'
import { PivotTable }           from '@/components/ui/PivotTable'
import { PivotChart }           from '@/components/ui/PivotChart'
import type { ChartType }       from '@/components/ui/PivotChart'
import type { Section }         from '@/types/app'
import type { RawRow }          from '@/lib/loader'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'
import { makeFormatter }        from '@/lib/pivot/format'
import { getSeriesLabels }      from '@/lib/pivot/chart'
import { ResultsToolbar }       from './ResultsToolbar'
import { ColorPickerPanel }     from './ColorPickerPanel'

type Props = {
  section:             Section
  headers:             string[]
  preview:             RawRow[]
  distinctValues:      Record<string, string[]>
  dragHandleAttrs:     DraggableAttributes
  dragHandleListeners: SortableListeners
  isDragging:          boolean
  onUpdate:            (patch: Partial<Section>) => void
  onLabelChange:       (label: string) => void
  onToggleCollapse:    () => void
  onConfigChange:      (state: ConfiguratorState) => void
  onCompute:           (config: PivotConfig) => void
  onCancel:            () => void
  onDelete:            () => void
  onToggleRowGroup:    (pk: string) => void
  onToggleColGroup:    (pk: string) => void
  onSetCollapsedRows:  (pks: string[]) => void
  onSetCollapsedCols:  (pks: string[]) => void
}

// ─── Composant principal ───────────────────────────────────────────────────

export function PivotSection({
  section, headers, preview, distinctValues,
  dragHandleAttrs, dragHandleListeners, isDragging,
  onUpdate, onLabelChange, onToggleCollapse,
  onConfigChange, onCompute, onCancel, onDelete,
  onToggleRowGroup, onToggleColGroup,
  onSetCollapsedRows, onSetCollapsedCols,
}: Props) {
  const [editingLabel,     setEditingLabel]     = useState(false)
  const [activeTab,        setActiveTab]        = useState<'config' | 'result'>('config')
  const [showRowTotals,    setShowRowTotals]    = useState(true)
  const [showColTotals,    setShowColTotals]    = useState(true)
  const [showColorPicker,  setShowColorPicker]  = useState(false)

  useEffect(() => {
    if (section.status === 'done') setActiveTab('result')
  }, [section.status])

  const hasResult    = section.result !== null
  const isHorizontal = section.chartLayout === 'horizontal'
  const formatValue  = makeFormatter(section.valueScale, section.valueDecimals)
  const seriesLabels = section.result
    ? getSeriesLabels(section.result, section.chartType, section.collapsedRowGroups, section.collapsedColGroups, section.chartTranspose)
    : []
  const canTranspose = section.chartType !== 'pie' && (section.result?.colKeys.length ?? 0) > 0

  return (
    <div className={[
      'rounded-[var(--radius-lg)] border border-border bg-surface',
      'transition-all duration-200',
      isDragging ? 'shadow-[var(--shadow-elevated)] opacity-80' : 'shadow-[var(--shadow-card)]',
    ].join(' ')}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button
          {...dragHandleAttrs}
          {...dragHandleListeners}
          className="text-subtle hover:text-muted cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        >
          <GripVertical size={15} />
        </button>

        <FileText size={13} className="text-accent/60 flex-shrink-0" />

        {editingLabel ? (
          <input
            autoFocus
            value={section.label}
            onChange={e => onLabelChange(e.target.value)}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false) }}
            className="flex-1 bg-transparent border-b border-accent/50 outline-none text-sm font-semibold text-text px-0.5"
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

        {section.status === 'done'      && <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />}
        {section.status === 'computing' && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />}
        {section.status === 'error'     && <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />}

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-subtle hover:text-text hover:bg-elevated transition-all duration-150"
            title={section.collapsed ? 'Déplier' : 'Replier'}
          >
            {section.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
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

      {/* ── Corps ── */}
      {!section.collapsed && (
        <div className="flex flex-col">

          {/* Onglets */}
          <div className="flex border-b border-border px-4">
            {(['config', 'result'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { if (tab === 'config' || hasResult) setActiveTab(tab) }}
                className={[
                  'px-3 py-2 text-[11px] font-medium border-b-2 -mb-px transition-all duration-150',
                  activeTab === tab
                    ? 'border-accent text-accent-hi'
                    : tab === 'result' && !hasResult
                      ? 'border-transparent text-subtle cursor-default'
                      : 'border-transparent text-muted hover:text-text',
                ].join(' ')}
              >
                {tab === 'config' ? 'Configuration' : 'Résultats'}
              </button>
            ))}
          </div>

          {/* ── Onglet Configuration ── */}
          {activeTab === 'config' && (
            <div className="px-5 py-4 flex flex-col gap-3">
              {section.status === 'error' && section.errorMessage && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30">
                  <AlertCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-danger text-xs">{section.errorMessage}</p>
                </div>
              )}
              <PivotConfigurator
                value={section.configuratorState}
                onChange={onConfigChange}
                headers={headers}
                preview={preview}
                distinctValues={distinctValues}
                status={section.status}
                progress={section.progress}
                onCompute={onCompute}
                onCancel={onCancel}
              />
            </div>
          )}

          {/* ── Onglet Résultats ── */}
          {activeTab === 'result' && (
            <div className="px-5 py-4 flex flex-col gap-3">
              {section.result ? (
                <>
                  {/* Barre de contrôles */}
                  <ResultsToolbar
                    section={section}
                    showRowTotals={showRowTotals}
                    showColTotals={showColTotals}
                    showColorPicker={showColorPicker}
                    seriesLabels={seriesLabels}
                    canTranspose={canTranspose}
                    onUpdate={onUpdate}
                    onToggleRowTotals={() => setShowRowTotals(v => !v)}
                    onToggleColTotals={() => setShowColTotals(v => !v)}
                    onToggleColorPicker={() => setShowColorPicker(v => !v)}
                  />

                  {/* Panneau de couleurs */}
                  {showColorPicker && seriesLabels.length > 0 && (
                    <ColorPickerPanel
                      seriesLabels={seriesLabels}
                      chartColors={section.chartColors}
                      onUpdate={onUpdate}
                    />
                  )}

                  {/* Tableau + Graphique */}
                  <div className={[
                    'flex gap-3',
                    isHorizontal ? 'flex-row items-stretch' : 'flex-col',
                  ].join(' ')}>

                    {/* Tableau */}
                    <div
                      className="min-w-0 overflow-x-auto"
                      style={{ flex: isHorizontal ? section.tableFlex : undefined }}
                    >
                      <PivotTable
                        data={section.result}
                        showRowTotals={showRowTotals}
                        showColTotals={showColTotals}
                        collapsedRowGroups={section.collapsedRowGroups}
                        collapsedColGroups={section.collapsedColGroups}
                        onToggleRowGroup={onToggleRowGroup}
                        onToggleColGroup={onToggleColGroup}
                        onSetCollapsedRows={onSetCollapsedRows}
                        onSetCollapsedCols={onSetCollapsedCols}
                        formatValue={formatValue}
                      />
                    </div>

                    {/* Séparateur */}
                    <div className={[
                      'bg-border flex-shrink-0',
                      isHorizontal ? 'w-px self-stretch' : 'h-px w-full',
                    ].join(' ')} />

                    {/* Graphique */}
                    <div
                      className="min-w-0 min-h-[280px]"
                      style={{ flex: isHorizontal ? section.chartFlex : undefined }}
                    >
                      <PivotChart
                        data={section.result}
                        chartType={section.chartType}
                        collapsedRows={section.collapsedRowGroups}
                        collapsedCols={section.collapsedColGroups}
                        formatValue={formatValue}
                        chartColors={section.chartColors}
                        transpose={section.chartTranspose}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-subtle italic">Aucun résultat pour le moment.</p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
