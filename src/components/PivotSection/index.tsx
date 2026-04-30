import { useState, useEffect }  from 'react'
import { useSortable }           from '@dnd-kit/sortable'
import type { DraggableAttributes } from '@dnd-kit/core'
type SortableListeners = ReturnType<typeof useSortable>['listeners']

import {
  GripVertical, ChevronDown, ChevronRight,
  X, FileText, AlertCircle,
  BarChart2, LineChart, PieChart,
  Columns2, Rows2,
} from 'lucide-react'

import { PivotConfigurator }    from '@/components/PivotConfigurator'
import { PivotTable }           from '@/components/ui/PivotTable'
import { PivotChart }           from '@/components/ui/PivotChart'
import type { ChartType }       from '@/components/ui/PivotChart'
import type { Section }         from '@/types/app'
import type { RawRow }          from '@/lib/loader'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'

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

// ─── Stepper flex ──────────────────────────────────────────────────────────

function FlexStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const btnCls = 'w-4 h-4 flex items-center justify-center rounded text-subtle hover:text-text hover:bg-elevated transition-colors text-[11px]'
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[10px] text-subtle mr-0.5">{label}</span>
      <button className={btnCls} onClick={() => onChange(Math.max(1, value - 1))}>−</button>
      <span className="w-4 text-center tabular-nums text-[11px] text-muted">{value}</span>
      <button className={btnCls} onClick={() => onChange(Math.min(20, value + 1))}>+</button>
    </div>
  )
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
  const [editingLabel, setEditingLabel] = useState(false)
  const [activeTab,    setActiveTab]    = useState<'config' | 'result'>('config')
  const [showRowTotals, setShowRowTotals] = useState(true)
  const [showColTotals, setShowColTotals] = useState(true)

  useEffect(() => {
    if (section.status === 'done') setActiveTab('result')
  }, [section.status])

  const hasResult   = section.result !== null
  const isHorizontal = section.chartLayout === 'horizontal'

  // Bouton de type de graphique
  const chartTypeBtn = (type: ChartType, Icon: React.ElementType, title: string) => (
    <button
      key={type}
      title={title}
      onClick={() => onUpdate({ chartType: type })}
      className={[
        'p-1.5 rounded-[var(--radius-sm)] border transition-all duration-150',
        section.chartType === type
          ? 'bg-accent/10 border-accent/40 text-accent-hi'
          : 'bg-elevated border-border text-subtle hover:text-text',
      ].join(' ')}
    >
      <Icon size={13} />
    </button>
  )

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
                  <div className="flex items-center justify-between gap-2 flex-wrap">

                    {/* Gauche : toggles totaux */}
                    <div className="flex items-center gap-2">
                      {([
                        { label: 'Totaux lignes',   value: showRowTotals, set: setShowRowTotals },
                        { label: 'Totaux colonnes', value: showColTotals, set: setShowColTotals },
                      ] as const).map(({ label, value, set }) => (
                        <button
                          key={label}
                          onClick={() => set(v => !v)}
                          className={[
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)]',
                            'text-[11px] font-medium border transition-all duration-150',
                            value
                              ? 'bg-accent/10 border-accent/40 text-accent-hi'
                              : 'bg-elevated border-border text-subtle hover:text-text',
                          ].join(' ')}
                        >
                          <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', value ? 'bg-accent' : 'bg-border-strong'].join(' ')} />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Droite : contrôles graphique */}
                    <div className="flex items-center gap-1.5 flex-wrap">

                      {/* Type de graphique */}
                      <div className="flex items-center gap-1">
                        {chartTypeBtn('bar',  BarChart2,   'Barres')}
                        {chartTypeBtn('line', LineChart,   'Lignes')}
                        {chartTypeBtn('pie',  PieChart,    'Camembert')}
                      </div>

                      <div className="w-px h-4 bg-border mx-0.5" />

                      {/* Layout */}
                      <div className="flex items-center gap-1">
                        {([
                          { layout: 'horizontal' as const, Icon: Columns2, title: 'Côte à côte' },
                          { layout: 'vertical'   as const, Icon: Rows2,    title: 'Empilé' },
                        ]).map(({ layout, Icon, title }) => (
                          <button
                            key={layout}
                            title={title}
                            onClick={() => onUpdate({ chartLayout: layout })}
                            className={[
                              'p-1.5 rounded-[var(--radius-sm)] border transition-all duration-150',
                              section.chartLayout === layout
                                ? 'bg-accent/10 border-accent/40 text-accent-hi'
                                : 'bg-elevated border-border text-subtle hover:text-text',
                            ].join(' ')}
                          >
                            <Icon size={13} />
                          </button>
                        ))}
                      </div>

                      {/* Flex (seulement en mode horizontal) */}
                      {isHorizontal && (
                        <>
                          <div className="w-px h-4 bg-border mx-0.5" />
                          <FlexStepper
                            label="T"
                            value={section.tableFlex}
                            onChange={v => onUpdate({ tableFlex: v })}
                          />
                          <FlexStepper
                            label="G"
                            value={section.chartFlex}
                            onChange={v => onUpdate({ chartFlex: v })}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tableau + Graphique */}
                  <div className={[
                    'flex gap-3',
                    isHorizontal ? 'flex-row items-start' : 'flex-col',
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
