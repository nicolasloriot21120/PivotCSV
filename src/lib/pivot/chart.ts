import type { PivotData } from './types'

// Helpers identiques à PivotTable pour la cohérence des clés
const keyStr  = (parts: string[]) => parts.join('\x00')
const cellKey = (rk: string, ck: string) => JSON.stringify([rk, ck])

// Le graphique utilise toujours le premier champ valeur configuré.
// Avec plusieurs valeurs, l'utilisateur peut choisir lequel afficher
// (fonctionnalité future — pour l'instant on prend values[0]).

// ─── Bar chart ───────────────────────────────────────────────────────────────
// Format Nivo ResponsiveBar :
//   [{ id: 'Nord', 'Cat A': 150, 'Cat B': 200 }, ...]
//   keys = ['Cat A', 'Cat B']  (colonnes → groupes de barres)

export type BarDatum = Record<string, string | number>

export function toBarData(data: PivotData): { barData: BarDatum[]; keys: string[] } {
  const { config, rowKeys, colKeys, cells, rowTotals } = data
  if (!rowKeys.length) return { barData: [], keys: [] }

  const valueField = config.values[0]

  if (!colKeys.length) {
    // Pas de colonnes : une barre par ligne, hauteur = total ligne
    return {
      keys:    [valueField.field],
      barData: rowKeys.map(rk => ({
        id:               rk[rk.length - 1],
        [valueField.field]: rowTotals[keyStr(rk)]?.[0] ?? 0,
      })),
    }
  }

  // Colonnes présentes : barres groupées, une couleur par colonne
  const keys = colKeys.map(ck => ck[ck.length - 1])
  const barData = rowKeys.map(rk => {
    const item: BarDatum = { id: rk[rk.length - 1] }
    for (const ck of colKeys) {
      item[ck[ck.length - 1]] = cells[cellKey(keyStr(rk), keyStr(ck))]?.[0] ?? 0
    }
    return item
  })
  return { barData, keys }
}

// ─── Line chart ──────────────────────────────────────────────────────────────
// Format Nivo ResponsiveLine :
//   [{ id: 'Cat A', data: [{ x: 'Nord', y: 150 }, ...] }, ...]
//   Une série par colonne (ou une seule série = valeur totale si pas de colonnes)

export type LineSeries = { id: string; data: { x: string; y: number }[] }

export function toLineData(data: PivotData): LineSeries[] {
  const { config, rowKeys, colKeys, cells, rowTotals } = data
  if (!rowKeys.length) return []

  const valueField = config.values[0]

  if (!colKeys.length) {
    return [{
      id:   valueField.field,
      data: rowKeys.map(rk => ({
        x: rk[rk.length - 1],
        y: rowTotals[keyStr(rk)]?.[0] ?? 0,
      })),
    }]
  }

  return colKeys.map(ck => ({
    id:   ck[ck.length - 1],
    data: rowKeys.map(rk => ({
      x: rk[rk.length - 1],
      y: cells[cellKey(keyStr(rk), keyStr(ck))]?.[0] ?? 0,
    })),
  }))
}

// ─── Pie chart ───────────────────────────────────────────────────────────────
// Format Nivo ResponsivePie :
//   [{ id: 'Nord', label: 'Nord', value: 350 }, ...]
//   Utilise les totaux ligne (ignore les colonnes — agrège tout).
//   Les valeurs négatives sont mises à 0 (Nivo ne supporte pas les arcs négatifs).

export type PieDatum = { id: string; label: string; value: number }

export function toPieData(data: PivotData): PieDatum[] {
  const { rowKeys, rowTotals } = data
  return rowKeys.map(rk => ({
    id:    keyStr(rk),
    label: rk[rk.length - 1],
    value: Math.max(0, rowTotals[keyStr(rk)]?.[0] ?? 0),
  }))
}
