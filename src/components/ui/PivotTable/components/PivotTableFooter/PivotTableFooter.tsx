import type { PivotValueConfig, AggregationType } from '@/lib/pivot/types'
import type { TreeNode } from '../../hooks/usePivotTable'
import styles from './PivotTableFooter.module.css'

export type PivotTableFooterProps = {
  colSlots:        TreeNode[]
  values:          PivotValueConfig[]
  grandTotal:      (number | null)[]
  hasCols:         boolean
  showRowTotals:   boolean
  getColTotalVals: (cs: TreeNode) => (number | null)[]
  fmtCell:         (v: number | null, agg: AggregationType) => string
}

export function PivotTableFooter({
  colSlots, values, grandTotal,
  hasCols, showRowTotals,
  getColTotalVals, fmtCell,
}: PivotTableFooterProps) {
  return (
    <tfoot>
      <tr>
        <td className={styles.tdFooterLabel}>
          Total
        </td>

        {hasCols && colSlots.flatMap((cs, ci) => {
          const vals = getColTotalVals(cs)
          return values.map((vc, vi) => (
            <td key={`ct-${ci}-${vi}`} className={styles.tdColTotal}>
              {fmtCell(vals[vi], vc.aggregation)}
            </td>
          ))
        })}

        {showRowTotals && values.map((vc, vi) => (
          <td key={`gt-${vi}`} className={styles.tdGrandTotal}>
            {fmtCell(grandTotal[vi] ?? null, vc.aggregation)}
          </td>
        ))}
      </tr>
    </tfoot>
  )
}
