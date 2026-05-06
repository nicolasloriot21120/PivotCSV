import type { PivotValueConfig, AggregationType } from '@/lib/pivot/types'
import { ChevronToggle } from '../ChevronToggle/ChevronToggle'
import type { TreeNode } from '../../hooks/usePivotTable'
import styles from './PivotTableBody.module.css'

const PADDING_BASE = 12
const PADDING_PER_DEPTH = 14

export type PivotTableBodyProps = {
  rowSlots:         TreeNode[]
  colSlots:         TreeNode[]
  values:           PivotValueConfig[]
  hasCols:          boolean
  showRowTotals:    boolean
  getCellVals:      (rs: TreeNode, cs: TreeNode) => (number | null)[]
  getRowTotalVals:  (rs: TreeNode) => (number | null)[]
  fmtCell:          (v: number | null, agg: AggregationType) => string
  onToggleRowGroup: (pk: string) => void
}

export function PivotTableBody({
  rowSlots, colSlots, values,
  hasCols, showRowTotals,
  getCellVals, getRowTotalVals, fmtCell,
  onToggleRowGroup,
}: PivotTableBodyProps) {
  return (
    <tbody>
      {rowSlots.map((rs, ri) => {
        const isGroup = rs.type === 'group'
        const depth = isGroup ? rs.depth : rs.key.length - 1
        const label = isGroup ? rs.label : rs.key[rs.key.length - 1]

        const labelCellClass = isGroup ? styles.tdRowLabelGroup : styles.tdRowLabelLeaf
        const valueCellClass = isGroup ? styles.tdValueGroup    : styles.tdValueLeaf
        const rowTotalClass  = isGroup ? styles.tdRowTotalGroup : styles.tdRowTotalLeaf

        return (
          <tr
            key={isGroup ? rs.prefixKey : rs.key.join('\x00')}
            className={styles.tableRow}
            data-row={isGroup ? "group" : ri % 2 !== 0 ? "odd" : undefined}
          >

            <td
              className={labelCellClass}
              style={{ paddingLeft: `${PADDING_BASE + depth * PADDING_PER_DEPTH}px` }}
            >
              {isGroup ? (
                <button
                  onClick={() => onToggleRowGroup(rs.prefixKey)}
                  className={styles.tdRowLabelButton}
                >
                  <ChevronToggle collapsed={rs.collapsed} />
                  {label}
                </button>
              ) : label}
            </td>

            {hasCols && colSlots.flatMap((cs, ci) => {
              const vals = getCellVals(rs, cs)
              return values.map((vc, vi) => (
                <td key={`${ci}-${vi}`} className={valueCellClass}>
                  {fmtCell(vals[vi], vc.aggregation)}
                </td>
              ))
            })}

            {showRowTotals && getRowTotalVals(rs).map((v, vi) => (
              <td key={`rt-${vi}`} className={rowTotalClass}>
                {fmtCell(v, values[vi].aggregation)}
              </td>
            ))}

          </tr>
        )
      })}
    </tbody>
  )
}
