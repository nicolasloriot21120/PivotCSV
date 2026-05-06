import type { PivotConfig } from '@/lib/pivot/types'
import { ChevronToggle } from '../ChevronToggle/ChevronToggle'
import { AGG_SYM, type HCell, type TreeNode } from '../../hooks/usePivotTable'
import styles from './PivotTableHead.module.css'

export type PivotTableHeadProps = {
  config:           PivotConfig
  colHdrs:          HCell[][]
  colSlots:         TreeNode[]
  hasCols:          boolean
  multiVal:         boolean
  showRowTotals:    boolean
  nVal:             number
  nHeaderRows:      number
  colHeaderRows:    number
  onToggleColGroup: (pk: string) => void
}

export function PivotTableHead({
  config, colHdrs, colSlots,
  hasCols, multiVal, showRowTotals,
  nVal, nHeaderRows, colHeaderRows,
  onToggleColGroup,
}: PivotTableHeadProps) {
  const { values } = config
  const rowsLabel = config.rows.map(f => f.field).join(' › ')

  return (
    <thead>

      {hasCols && colHdrs.map((row, di) => (
        <tr key={di}>

          {di === 0 && (
            <th rowSpan={nHeaderRows} className={styles.thRowsLabel}>
              {rowsLabel}
            </th>
          )}

          {row.map((cell, ci) => (
            <th
              key={ci}
              colSpan={cell.colSpan}
              rowSpan={cell.rowSpan}
              onClick={cell.prefixKey ? () => onToggleColGroup(cell.prefixKey!) : undefined}
              data-clickable={cell.prefixKey ? true : undefined}
              className={styles.thColCell}
            >
              <span className={styles.thInner}>
                {cell.prefixKey && <ChevronToggle collapsed={cell.collapsed} />}
                {cell.label}
              </span>
            </th>
          ))}

          {di === 0 && showRowTotals && (
            <th
              rowSpan={colHeaderRows}
              colSpan={nVal}
              className={styles.thTotalRoot}
            >
              Total
            </th>
          )}
        </tr>
      ))}

      {!hasCols && (
        <tr>
          <th rowSpan={nHeaderRows} className={styles.thRowsLabel}>
            {rowsLabel}
          </th>
          {showRowTotals && (
            <th
              rowSpan={colHeaderRows}
              colSpan={nVal}
              className={styles.thTotalRoot}
            >
              Total
            </th>
          )}
        </tr>
      )}

      {multiVal && (
        <tr>
          {hasCols && colSlots.flatMap((_, ci) =>
            values.map((vc, vi) => (
              <th key={`${ci}-${vi}`} className={styles.thValueLabel}>
                {AGG_SYM[vc.aggregation]} {vc.label ?? vc.field}
              </th>
            ))
          )}
          {showRowTotals && values.map((vc, vi) => (
            <th key={`rt-${vi}`} className={styles.thValueLabel}>
              {AGG_SYM[vc.aggregation]} {vc.label ?? vc.field}
            </th>
          ))}
        </tr>
      )}

    </thead>
  )
}
