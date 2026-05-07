import { useSortable }           from '@dnd-kit/sortable'
import type { DraggableAttributes } from '@dnd-kit/core'
type SortableListeners = ReturnType<typeof useSortable>['listeners']

import { AlertCircle } from 'lucide-react'

import { PivotConfigurator }    from '@/components/PivotConfigurator'
import { PivotTable }           from '@/components/ui/PivotTable'
import { PivotChart }           from '@/components/ui/PivotChart'
import type { Section }         from '@/types/app'
import type { RawRow }          from '@/lib/loader'
import type { PivotConfig }     from '@/lib/pivot/types'
import type { ConfiguratorState } from '@/components/PivotConfigurator/types'
import { PivotSectionHeader, ResultsToolbar, ColorPickerPanel } from './components'
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

export function PivotSection({
  section, headers, preview, distinctValues,
  dragHandleAttrs, dragHandleListeners, isDragging,
  onUpdate, onLabelChange, onToggleCollapse,
  onConfigChange, onCompute, onCancel, onDelete,
  onToggleRowGroup, onToggleColGroup,
  onSetCollapsedRows, onSetCollapsedCols,
}: Props) {
  const ui = usePivotSectionUI(section)

  return (
    <div data-dragging={isDragging || undefined} className={styles.card}>

      <PivotSectionHeader
        label={section.label}
        fileName={section.fileName}
        status={section.status}
        collapsed={section.collapsed}
        editingLabel={ui.editingLabel}
        dragHandleAttrs={dragHandleAttrs}
        dragHandleListeners={dragHandleListeners}
        onEditingLabelChange={ui.setEditingLabel}
        onLabelChange={onLabelChange}
        onToggleCollapse={onToggleCollapse}
        onDelete={onDelete}
      />

      {!section.collapsed && (
        <div className={styles.body}>

          <div className={styles.tabsBar}>
            {(['config', 'result'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { if (tab === 'config' || ui.hasResult) ui.setActiveTab(tab) }}
                data-state={
                  ui.activeTab === tab ? 'active' :
                  tab === 'result' && !ui.hasResult ? 'disabled' : 'idle'
                }
                className={styles.tab}
              >
                {tab === 'config' ? 'Configuration' : 'Résultats'}
              </button>
            ))}
          </div>

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

                  <div
                    className={styles.resultsLayout}
                    data-layout={ui.isHorizontal ? 'horizontal' : 'vertical'}
                  >
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

                    <div
                      className={styles.divider}
                      data-orientation={ui.isHorizontal ? 'vertical' : 'horizontal'}
                    />

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
