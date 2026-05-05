import { ChevronDown, ChevronRight } from 'lucide-react'
import type { PivotData } from '@/lib/pivot/types'
import { usePivotTable, AGG_SYM } from './hooks/usePivotTable'
import styles from './styles.module.css'

// =============================================================================
// PROPS DU COMPOSANT
// =============================================================================

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

// =============================================================================
// COMPOSANT
// =============================================================================

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

  // true = au moins un groupe est replié → le bouton proposera "Ouvrir"
  const rowHasClosed = collapsedRowGroups.length > 0
  const colHasClosed = collapsedColGroups.length > 0

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className={styles.root}>

      {/* ── Toolbar toggle par axe ──────────────────────────────────────── */}
      {(hasRowGroups || hasColGroups) && (
        <div className={styles.toolbar}>
          {hasRowGroups && (
            <button
              onClick={() => rowHasClosed ? onSetCollapsedRows([]) : onSetCollapsedRows(allRowGroupKeys)}
              className={rowHasClosed ? styles.toggleButtonActive : styles.toggleButtonIdle}
            >
              <span className={rowHasClosed ? styles.toggleDotActive : styles.toggleDotIdle} />
              Lignes — {rowHasClosed ? 'Ouvrir' : 'Fermer'}
            </button>
          )}
          {hasColGroups && (
            <button
              onClick={() => colHasClosed ? onSetCollapsedCols([]) : onSetCollapsedCols(allColGroupKeys)}
              className={colHasClosed ? styles.toggleButtonActive : styles.toggleButtonIdle}
            >
              <span className={colHasClosed ? styles.toggleDotActive : styles.toggleDotIdle} />
              Colonnes — {colHasClosed ? 'Ouvrir' : 'Fermer'}
            </button>
          )}
        </div>
      )}

    <div className={styles.tableContainer}>
      <table className={styles.table}>

        <thead>

          {/* CAS NORMAL : au moins un champ colonne → une ligne par niveau */}
          {hasCols && colHdrs.map((row, di) => (
            <tr key={di}>

              {di === 0 && (
                <th rowSpan={nHeaderRows} className={styles.thRowsLabel}>
                  {config.rows.map(f => f.field).join(' › ')}
                </th>
              )}

              {row.map((cell, ci) => (
                <th
                  key={ci}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  onClick={cell.prefixKey ? () => onToggleColGroup(cell.prefixKey!) : undefined}
                  className={cell.prefixKey ? styles.thColCellClickable : styles.thColCell}
                >
                  <span className={styles.thInner}>
                    {cell.prefixKey && (
                      cell.collapsed
                        ? <ChevronRight size={11} className={styles.thChevron} />
                        : <ChevronDown  size={11} className={styles.thChevron} />
                    )}
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

          {/* CAS SANS CHAMP COLONNE */}
          {!hasCols && (
            <tr>
              <th rowSpan={nHeaderRows} className={styles.thRowsLabel}>
                {config.rows.map(f => f.field).join(' › ')}
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

          {/* LIGNE DE LABELS VALEURS (seulement si nVal > 1) */}
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

        <tbody>
          {rowSlots.map((rs, ri) => {
            const isGroup = rs.type === 'group'
            const depth = isGroup ? rs.depth : (rs as { key: string[] }).key.length - 1
            const label = isGroup ? rs.label : (rs as { key: string[] }).key[(rs as { key: string[] }).key.length - 1]

            const rowClass = isGroup
              ? styles.rowGroup
              : ri % 2 === 0 ? undefined : styles.rowLeafOdd

            const labelCellClass = isGroup ? styles.tdRowLabelGroup : styles.tdRowLabelLeaf
            const valueCellClass = isGroup ? styles.tdValueGroup    : styles.tdValueLeaf
            const rowTotalClass  = isGroup ? styles.tdRowTotalGroup : styles.tdRowTotalLeaf

            return (
              <tr
                key={isGroup ? rs.prefixKey : (rs as { key: string[] }).key.join('\x00')}
                className={rowClass}
              >

                <td
                  className={labelCellClass}
                  style={{ paddingLeft: `${12 + depth * 14}px` }}
                >
                  {isGroup ? (
                    <button
                      onClick={() => onToggleRowGroup(rs.prefixKey)}
                      className={styles.tdRowLabelButton}
                    >
                      {rs.collapsed
                        ? <ChevronRight size={11} className={styles.thChevron} />
                        : <ChevronDown  size={11} className={styles.thChevron} />
                      }
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

        {showColTotals && (
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
        )}

      </table>
    </div>
    </div>
  )
}
