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
import type { Section }         from '@/types/app'
import type { RawRow }          from '@/lib/loader'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'
import { ResultsToolbar, ColorPickerPanel }       from './components'
import { usePivotSectionUI }    from './hooks/usePivotSectionUI'
import styles                   from './styles.module.css'

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

const STATUS_DOT_CLASS: Record<Section['status'], string | null> = {
  idle:      null,
  computing: styles.statusDotComputing,
  done:      styles.statusDotDone,
  error:     styles.statusDotError,
}

export function PivotSection({
  section, headers, preview, distinctValues,
  dragHandleAttrs, dragHandleListeners, isDragging,
  onUpdate, onLabelChange, onToggleCollapse,
  onConfigChange, onCompute, onCancel, onDelete,
  onToggleRowGroup, onToggleColGroup,
  onSetCollapsedRows, onSetCollapsedCols,
}: Props) {
  const ui = usePivotSectionUI(section)
  const statusDotClass = STATUS_DOT_CLASS[section.status]

  return (
    <div className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}>

      {/* ── Header ── */}
      <div className={styles.headerBar}>
        <button
          {...dragHandleAttrs}
          {...dragHandleListeners}
          className={styles.dragHandle}
        >
          <GripVertical size={15} />
        </button>

        <FileText size={13} className={styles.fileIcon} />

        {ui.editingLabel ? (
          <input
            autoFocus
            value={section.label}
            onChange={e => onLabelChange(e.target.value)}
            onBlur={() => ui.setEditingLabel(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') ui.setEditingLabel(false) }}
            className={styles.labelInput}
          />
        ) : (
          <span
            className={styles.labelText}
            onDoubleClick={() => ui.setEditingLabel(true)}
            title="Double-cliquer pour renommer"
          >
            {section.label}
          </span>
        )}

        <span className={styles.fileName}>
          {section.fileName}
        </span>

        {statusDotClass && <span className={statusDotClass} />}

        <div className={styles.headerActions}>
          <button
            onClick={onToggleCollapse}
            className={styles.iconButtonNeutral}
            title={section.collapsed ? 'Déplier' : 'Replier'}
          >
            {section.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onDelete}
            className={styles.iconButtonDanger}
            title="Supprimer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Corps ── */}
      {!section.collapsed && (
        <div className={styles.body}>

          {/* Onglets */}
          <div className={styles.tabsBar}>
            {(['config', 'result'] as const).map(tab => {
              const tabClass = ui.activeTab === tab
                ? styles.tabActive
                : tab === 'result' && !ui.hasResult
                  ? styles.tabDisabled
                  : styles.tabIdle
              return (
                <button
                  key={tab}
                  onClick={() => { if (tab === 'config' || ui.hasResult) ui.setActiveTab(tab) }}
                  className={tabClass}
                >
                  {tab === 'config' ? 'Configuration' : 'Résultats'}
                </button>
              )
            })}
          </div>

          {/* ── Onglet Configuration ── */}
          {ui.activeTab === 'config' && (
            <div className={styles.tabPanel}>
              {section.status === 'error' && section.errorMessage && (
                <div className={styles.errorBox}>
                  <AlertCircle size={14} className={styles.errorIcon} />
                  <p className={styles.errorText}>{section.errorMessage}</p>
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
          {ui.activeTab === 'result' && (
            <div className={styles.tabPanel}>
              {section.result ? (
                <>
                  <ResultsToolbar
                    section={section}
                    showRowTotals={ui.showRowTotals}
                    showColTotals={ui.showColTotals}
                    showColorPicker={ui.showColorPicker}
                    seriesLabels={ui.seriesLabels}
                    canTranspose={ui.canTranspose}
                    onUpdate={onUpdate}
                    onToggleRowTotals={() => ui.setShowRowTotals(v => !v)}
                    onToggleColTotals={() => ui.setShowColTotals(v => !v)}
                    onToggleColorPicker={() => ui.setShowColorPicker(v => !v)}
                  />

                  {ui.showColorPicker && ui.seriesLabels.length > 0 && (
                    <ColorPickerPanel
                      seriesLabels={ui.seriesLabels}
                      chartColors={section.chartColors}
                      onUpdate={onUpdate}
                    />
                  )}

                  {/* Tableau + Graphique */}
                  <div className={ui.isHorizontal ? styles.resultsLayoutHorizontal : styles.resultsLayoutVertical}>

                    <div
                      className={styles.tableContainer}
                      style={{ flex: ui.isHorizontal ? section.tableFlex : undefined }}
                    >
                      <PivotTable
                        data={section.result}
                        showRowTotals={ui.showRowTotals}
                        showColTotals={ui.showColTotals}
                        collapsedRowGroups={section.collapsedRowGroups}
                        collapsedColGroups={section.collapsedColGroups}
                        onToggleRowGroup={onToggleRowGroup}
                        onToggleColGroup={onToggleColGroup}
                        onSetCollapsedRows={onSetCollapsedRows}
                        onSetCollapsedCols={onSetCollapsedCols}
                        formatValue={ui.formatValue}
                      />
                    </div>

                    <div className={ui.isHorizontal ? styles.dividerVertical : styles.dividerHorizontal} />

                    <div
                      className={styles.chartContainer}
                      style={{ flex: ui.isHorizontal ? section.chartFlex : undefined }}
                    >
                      <PivotChart
                        data={section.result}
                        chartType={section.chartType}
                        collapsedRows={section.collapsedRowGroups}
                        collapsedCols={section.collapsedColGroups}
                        formatValue={ui.formatValue}
                        chartColors={section.chartColors}
                        transpose={section.chartTranspose}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className={styles.emptyResult}>Aucun résultat pour le moment.</p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
