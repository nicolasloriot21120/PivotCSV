import type { PivotData, AggregationType } from '@/lib/pivot/types'

// Mirrors PivotAccumulator key helpers
const keyStr  = (parts: string[])        => parts.join('\x00')
const cellKey = (rk: string, ck: string) => JSON.stringify([rk, ck])
const joinKey = (parts: string[])        => parts.join(' › ') || '(vide)'

const AGG_SYMBOLS: Record<AggregationType, string> = {
  sum:   'Σ', count: '#', avg: 'Ø', min: '▼', max: '▲',
}

function fmt(value: number | null, agg: AggregationType): string {
  if (value === null) return '—'
  if (agg === 'count') return value.toLocaleString('fr-FR')
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

export type PivotTableProps = {
  data:          PivotData
  showRowTotals: boolean
  showColTotals: boolean
}

export function PivotTable({ data, showRowTotals, showColTotals }: PivotTableProps) {
  const { config, rowKeys, colKeys, cells, rowTotals, colTotals, grandTotal } = data
  const values   = config.values
  const nVal     = values.length
  const multiVal = nVal > 1

  const getCell     = (rp: string[], cp: string[]) => cells[cellKey(keyStr(rp), keyStr(cp))] ?? Array(nVal).fill(null)
  const getRowTotal = (rp: string[])               => rowTotals[keyStr(rp)] ?? Array(nVal).fill(null)
  const getColTotal = (cp: string[])               => colTotals[keyStr(cp)] ?? Array(nVal).fill(null)

  if (rowKeys.length === 0) {
    return <p className="text-xs text-subtle italic">Aucune donnée à afficher.</p>
  }

  // Colonnes affichées (on exclut la colonne vide si pas de champ colonne configuré)
  const hasColField  = config.columns.length > 0
  const displayCols  = hasColField ? colKeys : []

  return (
    <div className="overflow-auto rounded-[var(--radius-md)] border border-border">
      <table className="border-collapse text-xs w-full">
        <thead>

          {/* ── Ligne 1 : en-têtes colonnes ── */}
          <tr>
            {/* Coin supérieur gauche */}
            <th
              rowSpan={multiVal ? 2 : 1}
              className="border border-border bg-elevated px-3 py-2 text-left text-subtle font-medium whitespace-nowrap"
            >
              {config.rows.join(' › ')}
            </th>

            {displayCols.map(cp => (
              <th
                key={keyStr(cp)}
                colSpan={multiVal ? nVal : 1}
                className="border border-border bg-elevated px-3 py-2 text-center font-semibold text-text whitespace-nowrap"
              >
                {joinKey(cp)}
              </th>
            ))}

            {showRowTotals && (
              <th
                colSpan={multiVal ? nVal : 1}
                className="border border-border bg-elevated px-3 py-2 text-center font-semibold text-accent-hi whitespace-nowrap"
              >
                Total
              </th>
            )}
          </tr>

          {/* ── Ligne 2 : labels valeurs (si plusieurs) ── */}
          {multiVal && (
            <tr>
              {[...displayCols, ...(showRowTotals ? [[]] : [])].map((cp, ci) =>
                values.map(vc => (
                  <th
                    key={`${ci}-${vc.field}`}
                    className="border border-border bg-elevated/60 px-2 py-1 text-center text-subtle font-medium whitespace-nowrap"
                  >
                    {AGG_SYMBOLS[vc.aggregation]} {vc.label ?? vc.field}
                  </th>
                ))
              )}
            </tr>
          )}

        </thead>

        <tbody>
          {rowKeys.map((rp, ri) => (
            <tr key={keyStr(rp)} className={ri % 2 === 1 ? 'bg-elevated/20' : ''}>

              {/* Label ligne */}
              <td className="border border-border px-3 py-1.5 font-medium text-text whitespace-nowrap">
                {joinKey(rp)}
              </td>

              {/* Cellules */}
              {displayCols.map(cp =>
                values.map((vc, vi) => (
                  <td
                    key={`${keyStr(cp)}-${vi}`}
                    className="border border-border px-3 py-1.5 text-right tabular-nums text-muted"
                  >
                    {fmt(getCell(rp, cp)[vi] ?? null, vc.aggregation)}
                  </td>
                ))
              )}

              {/* Total ligne */}
              {showRowTotals && values.map((vc, vi) => (
                <td
                  key={`rt-${vi}`}
                  className="border border-border px-3 py-1.5 text-right tabular-nums font-semibold text-text bg-elevated/30"
                >
                  {fmt(getRowTotal(rp)[vi] ?? null, vc.aggregation)}
                </td>
              ))}

            </tr>
          ))}
        </tbody>

        {/* ── Totaux colonnes ── */}
        {showColTotals && (
          <tfoot>
            <tr>
              <td className="border border-border px-3 py-1.5 font-semibold text-accent-hi bg-elevated/30 whitespace-nowrap">
                Total
              </td>

              {displayCols.map(cp =>
                values.map((vc, vi) => (
                  <td
                    key={`ct-${keyStr(cp)}-${vi}`}
                    className="border border-border px-3 py-1.5 text-right tabular-nums font-semibold text-text bg-elevated/30"
                  >
                    {fmt(getColTotal(cp)[vi] ?? null, vc.aggregation)}
                  </td>
                ))
              )}

              {/* Grand total */}
              {showRowTotals && values.map((vc, vi) => (
                <td
                  key={`gt-${vi}`}
                  className="border border-border px-3 py-1.5 text-right tabular-nums font-bold text-accent-hi bg-accent/10"
                >
                  {fmt(grandTotal[vi] ?? null, vc.aggregation)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}

      </table>
    </div>
  )
}
