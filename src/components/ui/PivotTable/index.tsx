import { ChevronDown, ChevronRight } from 'lucide-react'
import type { PivotData, AggregationType } from '@/lib/pivot/types'
import { usePivotTable, AGG_SYM, allGroupKeys } from './usePivotTable'
import type { TreeNode } from './usePivotTable'

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
    rowTree, colTree,
    rowSlots, colSlots,
    colHdrs,
    nVal, nRF, nCF, multiVal, hasCols,
    hasRowGroups, hasColGroups,
    nHeaderRows, colHeaderRows,
    getCellVals, getRowTotalVals, getColTotalVals,
    fmtCell,
    allRowGroupKeys, allColGroupKeys,
  } = usePivotTable({ data, collapsedRowGroups, collapsedColGroups, formatValue })

  const { config, grandTotal } = data
  const { values } = config

  if (!rowSlots.length) {
    return <p className="text-xs text-subtle italic">Aucune donnée à afficher.</p>
  }

  // Classes CSS partagées pour éviter la répétition
  const thBase = 'border border-border bg-elevated px-3 py-2 font-medium whitespace-nowrap'
  const tdBase = 'border border-border px-3 py-1.5 whitespace-nowrap'

  // true = au moins un groupe est replié → le bouton proposera "Ouvrir"
  const rowHasClosed = collapsedRowGroups.length > 0
  const colHasClosed = collapsedColGroups.length > 0

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="flex flex-col gap-2">

      {/* ── Toolbar toggle par axe ──────────────────────────────────────── */}
      {(hasRowGroups || hasColGroups) && (
        <div className="flex items-center gap-2 flex-wrap">
          {hasRowGroups && (
            <button
              onClick={() => rowHasClosed ? onSetCollapsedRows([]) : onSetCollapsedRows(allRowGroupKeys)}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)]',
                'text-[11px] font-medium border transition-all duration-150',
                rowHasClosed
                  ? 'bg-accent/10 border-accent/40 text-accent-hi'
                  : 'bg-elevated border-border text-subtle hover:text-text',
              ].join(' ')}
            >
              <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', rowHasClosed ? 'bg-accent' : 'bg-border-strong'].join(' ')} />
              Lignes — {rowHasClosed ? 'Ouvrir' : 'Fermer'}
            </button>
          )}
          {hasColGroups && (
            <button
              onClick={() => colHasClosed ? onSetCollapsedCols([]) : onSetCollapsedCols(allColGroupKeys)}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)]',
                'text-[11px] font-medium border transition-all duration-150',
                colHasClosed
                  ? 'bg-accent/10 border-accent/40 text-accent-hi'
                  : 'bg-elevated border-border text-subtle hover:text-text',
              ].join(' ')}
            >
              <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', colHasClosed ? 'bg-accent' : 'bg-border-strong'].join(' ')} />
              Colonnes — {colHasClosed ? 'Ouvrir' : 'Fermer'}
            </button>
          )}
        </div>
      )}

    <div className="overflow-auto rounded-[var(--radius-md)] border border-border">
      <table className="border-collapse text-xs w-full">

        <thead>

          {/* CAS NORMAL : au moins un champ colonne → une ligne par niveau */}
          {hasCols && colHdrs.map((row, di) => (
            <tr key={di}>

              {di === 0 && (
                <th
                  rowSpan={nHeaderRows}
                  className={`${thBase} text-left text-subtle`}
                >
                  {config.rows.map(f => f.field).join(' › ')}
                </th>
              )}

              {row.map((cell, ci) => (
                <th
                  key={ci}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  onClick={cell.prefixKey ? () => onToggleColGroup(cell.prefixKey!) : undefined}
                  className={[
                    thBase, 'text-center',
                    cell.prefixKey
                      ? 'cursor-pointer select-none hover:bg-elevated/80 text-text'
                      : 'text-text font-semibold',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-center gap-1">
                    {cell.prefixKey && (
                      cell.collapsed
                        ? <ChevronRight size={11} className="text-accent flex-shrink-0" />
                        : <ChevronDown  size={11} className="text-accent flex-shrink-0" />
                    )}
                    {cell.label}
                  </span>
                </th>
              ))}

              {di === 0 && showRowTotals && (
                <th
                  rowSpan={colHeaderRows}
                  colSpan={nVal}
                  className={`${thBase} text-center text-accent-hi font-semibold`}
                >
                  Total
                </th>
              )}
            </tr>
          ))}

          {/* CAS SANS CHAMP COLONNE */}
          {!hasCols && (
            <tr>
              <th rowSpan={nHeaderRows} className={`${thBase} text-left text-subtle`}>
                {config.rows.map(f => f.field).join(' › ')}
              </th>
              {showRowTotals && (
                <th
                  rowSpan={colHeaderRows}
                  colSpan={nVal}
                  className={`${thBase} text-center text-accent-hi font-semibold`}
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
                  <th
                    key={`${ci}-${vi}`}
                    className={`${thBase} text-center text-subtle font-medium text-[10px]`}
                  >
                    {AGG_SYM[vc.aggregation]} {vc.label ?? vc.field}
                  </th>
                ))
              )}
              {showRowTotals && values.map((vc, vi) => (
                <th
                  key={`rt-${vi}`}
                  className={`${thBase} text-center text-subtle font-medium text-[10px]`}
                >
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

            return (
              <tr
                key={isGroup ? rs.prefixKey : (rs as { key: string[] }).key.join('\x00')}
                className={isGroup ? 'bg-elevated/60' : ri % 2 === 0 ? '' : 'bg-elevated/20'}
              >

                <td
                  className={[
                    tdBase,
                    'text-text',
                    isGroup
                      ? 'font-semibold !border-l-2 !border-l-accent/50'
                      : 'font-medium text-muted/90',
                  ].join(' ')}
                  style={{ paddingLeft: `${12 + depth * 14}px` }}
                >
                  {isGroup ? (
                    <button
                      onClick={() => onToggleRowGroup(rs.prefixKey)}
                      className="flex items-center gap-1 w-full text-left"
                    >
                      {rs.collapsed
                        ? <ChevronRight size={11} className="text-accent flex-shrink-0" />
                        : <ChevronDown  size={11} className="text-accent flex-shrink-0" />
                      }
                      {label}
                    </button>
                  ) : label}
                </td>

                {hasCols && colSlots.flatMap((cs, ci) => {
                  const vals = getCellVals(rs, cs)
                  return values.map((vc, vi) => (
                    <td
                      key={`${ci}-${vi}`}
                      className={`${tdBase} text-right tabular-nums ${isGroup ? 'text-text font-medium' : 'text-muted'}`}
                    >
                      {fmtCell(vals[vi], vc.aggregation)}
                    </td>
                  ))
                })}

                {showRowTotals && getRowTotalVals(rs).map((v, vi) => (
                  <td
                    key={`rt-${vi}`}
                    className={`${tdBase} text-right tabular-nums bg-elevated/30 ${isGroup ? 'font-bold text-text' : 'font-semibold text-text'}`}
                  >
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
              <td className={`${tdBase} font-semibold text-accent-hi bg-elevated/30`}>
                Total
              </td>

              {hasCols && colSlots.flatMap((cs, ci) => {
                const vals = getColTotalVals(cs)
                return values.map((vc, vi) => (
                  <td
                    key={`ct-${ci}-${vi}`}
                    className={`${tdBase} text-right tabular-nums font-semibold text-text bg-elevated/30`}
                  >
                    {fmtCell(vals[vi], vc.aggregation)}
                  </td>
                ))
              })}

              {showRowTotals && values.map((vc, vi) => (
                <td
                  key={`gt-${vi}`}
                  className={`${tdBase} text-right tabular-nums font-bold text-accent-hi bg-accent/10`}
                >
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
