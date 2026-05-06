import type { PivotData } from '@/lib/pivot/types'
import { usePivotTable } from './hooks/usePivotTable'
import { PivotTableToolbar } from './components/PivotTableToolbar/PivotTableToolbar'
import { PivotTableHead } from './components/PivotTableHead/PivotTableHead'
import { PivotTableBody } from './components/PivotTableBody/PivotTableBody'
import { PivotTableFooter } from './components/PivotTableFooter/PivotTableFooter'
import styles from './styles.module.css'

export type PivotTableProps = {
  data:               PivotData
  showRowTotals:      boolean
  showColTotals:      boolean
  collapsedRowGroups: string[]
  collapsedColGroups: string[]
  onToggleRowGroup:   (pk: string) => void
  onToggleColGroup:   (pk: string) => void
  onSetCollapsedRows: (pks: string[]) => void
  onSetCollapsedCols: (pks: string[]) => void
  formatValue?:       (v: number) => string
}

export function PivotTable({
  data, showRowTotals, showColTotals,
  collapsedRowGroups, collapsedColGroups,
  onToggleRowGroup, onToggleColGroup,
  onSetCollapsedRows, onSetCollapsedCols,
  formatValue,
}: PivotTableProps) {
  const {
    rowSlots, colSlots,
    colHdrs,
    nVal, multiVal, hasCols,
    hasRowGroups, hasColGroups,
    nHeaderRows, colHeaderRows,
    getCellVals, getRowTotalVals, getColTotalVals,
    fmtCell,
    allRowGroupKeys, allColGroupKeys,
  } = usePivotTable({ data, collapsedRowGroups, collapsedColGroups, formatValue })

  const { config, grandTotal } = data
  const { values } = config

  if (!rowSlots.length) {
    return <p className={styles.empty}>Aucune donnée à afficher.</p>
  }

  const rowHasClosed = collapsedRowGroups.length > 0
  const colHasClosed = collapsedColGroups.length > 0

  return (
    <div className={styles.root}>

      <PivotTableToolbar
        hasRowGroups={hasRowGroups}
        hasColGroups={hasColGroups}
        rowHasClosed={rowHasClosed}
        colHasClosed={colHasClosed}
        allRowGroupKeys={allRowGroupKeys}
        allColGroupKeys={allColGroupKeys}
        onSetCollapsedRows={onSetCollapsedRows}
        onSetCollapsedCols={onSetCollapsedCols}
      />

      <div className={styles.tableContainer}>
        <table className={styles.table}>

          <PivotTableHead
            config={config}
            colHdrs={colHdrs}
            colSlots={colSlots}
            hasCols={hasCols}
            multiVal={multiVal}
            showRowTotals={showRowTotals}
            nVal={nVal}
            nHeaderRows={nHeaderRows}
            colHeaderRows={colHeaderRows}
            onToggleColGroup={onToggleColGroup}
          />

          <PivotTableBody
            rowSlots={rowSlots}
            colSlots={colSlots}
            values={values}
            hasCols={hasCols}
            showRowTotals={showRowTotals}
            getCellVals={getCellVals}
            getRowTotalVals={getRowTotalVals}
            fmtCell={fmtCell}
            onToggleRowGroup={onToggleRowGroup}
          />

          {showColTotals && (
            <PivotTableFooter
              colSlots={colSlots}
              values={values}
              grandTotal={grandTotal}
              hasCols={hasCols}
              showRowTotals={showRowTotals}
              getColTotalVals={getColTotalVals}
              fmtCell={fmtCell}
            />
          )}

        </table>
      </div>
    </div>
  )
}
