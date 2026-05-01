import type { PivotData } from './types'

const keyStr  = (parts: string[]) => parts.join('\x00')
const cellKey = (rk: string, ck: string) => JSON.stringify([rk, ck])
const dispKey = (parts: string[]) => parts.join(' › ')

// ─── Visibilité selon l'état replié ──────────────────────────────────────────
// Un item visible est soit :
//   - une feuille dont aucun ancêtre n'est replié
//   - un groupe replié (remplace ses enfants, agrégeant leurs valeurs)

type VisItem = {
  label:    string    // label d'axe/légende
  leaves:   string[]  // keyStr des feuilles qui contribuent à la valeur
}

function getVisible(allKeys: string[][], collapsed: string[]): VisItem[] {
  const cSet  = new Set(collapsed)
  const result: VisItem[]  = []
  const seenGroups = new Set<string>()

  for (const key of allKeys) {
    let groupPath: string[] | null = null
    for (let i = 1; i < key.length; i++) {
      if (cSet.has(keyStr(key.slice(0, i)))) { groupPath = key.slice(0, i); break }
    }

    if (!groupPath) {
      result.push({ label: dispKey(key), leaves: [keyStr(key)] })
    } else {
      const gk = keyStr(groupPath)
      if (!seenGroups.has(gk)) {
        seenGroups.add(gk)
        result.push({
          label:  dispKey(groupPath),
          leaves: allKeys.filter(k => keyStr(k).startsWith(gk + '\x00')).map(keyStr),
        })
      }
    }
  }
  return result
}

// Somme une valeur (index 0) sur une liste de clés feuilles
const sumLeaves = (
  leaves: string[],
  lookup: Record<string, (number | null)[]>,
) => leaves.reduce((s, k) => s + (lookup[k]?.[0] ?? 0), 0)

// ─── Bar chart ───────────────────────────────────────────────────────────────

export type BarDatum = Record<string, string | number>

export function toBarData(
  data: PivotData,
  collapsedRows: string[] = [],
  collapsedCols: string[] = [],
  transpose = false,
): { barData: BarDatum[]; keys: string[] } {
  const { config, rowKeys, colKeys, cells, rowTotals } = data
  if (!rowKeys.length) return { barData: [], keys: [] }

  const valueField = config.values[0]
  const visRows = getVisible(rowKeys, collapsedRows)

  if (!colKeys.length) {
    return {
      keys:    [valueField.field],
      barData: visRows.map(({ label, leaves }) => ({
        id:                 label,
        [valueField.field]: sumLeaves(leaves, rowTotals),
      })),
    }
  }

  const visCols = getVisible(colKeys, collapsedCols)

  const sumCell = (rowLeaves: string[], colLeaves: string[]) =>
    rowLeaves.reduce((s, rk) =>
      colLeaves.reduce((s2, ck) => s2 + (cells[cellKey(rk, ck)]?.[0] ?? 0), s), 0)

  if (!transpose) {
    const keys    = visCols.map(c => c.label)
    const barData = visRows.map(({ label, leaves: rowLeaves }) => {
      const item: BarDatum = { id: label }
      for (const { label: colLabel, leaves: colLeaves } of visCols) {
        item[colLabel] = sumCell(rowLeaves, colLeaves)
      }
      return item
    })
    return { barData, keys }
  } else {
    const keys    = visRows.map(r => r.label)
    const barData = visCols.map(({ label, leaves: colLeaves }) => {
      const item: BarDatum = { id: label }
      for (const { label: rowLabel, leaves: rowLeaves } of visRows) {
        item[rowLabel] = sumCell(rowLeaves, colLeaves)
      }
      return item
    })
    return { barData, keys }
  }
}

// ─── Line chart ──────────────────────────────────────────────────────────────

export type LineSeries = { id: string; data: { x: string; y: number }[] }

export function toLineData(
  data: PivotData,
  collapsedRows: string[] = [],
  collapsedCols: string[] = [],
  transpose = false,
): LineSeries[] {
  const { config, rowKeys, colKeys, cells, rowTotals } = data
  if (!rowKeys.length) return []

  const valueField = config.values[0]
  const visRows    = getVisible(rowKeys, collapsedRows)

  if (!colKeys.length) {
    return [{
      id:   valueField.field,
      data: visRows.map(({ label, leaves }) => ({
        x: label,
        y: sumLeaves(leaves, rowTotals),
      })),
    }]
  }

  const visCols = getVisible(colKeys, collapsedCols)

  if (!transpose) {
    return visCols.map(({ label: colLabel, leaves: colLeaves }) => ({
      id:   colLabel,
      data: visRows.map(({ label, leaves: rowLeaves }) => ({
        x: label,
        y: rowLeaves.reduce((s, rk) =>
          colLeaves.reduce((s2, ck) => s2 + (cells[cellKey(rk, ck)]?.[0] ?? 0), s), 0),
      })),
    }))
  } else {
    return visRows.map(({ label: rowLabel, leaves: rowLeaves }) => ({
      id:   rowLabel,
      data: visCols.map(({ label, leaves: colLeaves }) => ({
        x: label,
        y: rowLeaves.reduce((s, rk) =>
          colLeaves.reduce((s2, ck) => s2 + (cells[cellKey(rk, ck)]?.[0] ?? 0), s), 0),
      })),
    }))
  }
}

// ─── Pie chart ───────────────────────────────────────────────────────────────

// ─── Labels des séries visibles (pour le color picker) ───────────────────────

export function getSeriesLabels(
  data: PivotData,
  chartType: 'bar' | 'line' | 'pie',
  collapsedRows: string[],
  collapsedCols: string[],
  transpose = false,
): string[] {
  if (chartType === 'pie') return getVisible(data.rowKeys, collapsedRows).map(v => v.label)
  if (!data.colKeys.length)  return [data.config.values[0]?.field ?? '']
  if (transpose) return getVisible(data.rowKeys, collapsedRows).map(v => v.label)
  return getVisible(data.colKeys, collapsedCols).map(v => v.label)
}

// ─── Pie chart ───────────────────────────────────────────────────────────────

export type PieDatum = { id: string; label: string; value: number }

export function toPieData(
  data: PivotData,
  collapsedRows: string[] = [],
): PieDatum[] {
  const { rowKeys, rowTotals } = data
  return getVisible(rowKeys, collapsedRows).map(({ label, leaves }) => ({
    id:    label,
    label,
    value: Math.max(0, sumLeaves(leaves, rowTotals)),
  }))
}
