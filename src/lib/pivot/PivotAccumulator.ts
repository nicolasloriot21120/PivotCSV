import type { RawRow } from '../loader/csv/types'
import type { AggregationType, PivotConfig, PivotData } from './types'

type Accum = { sum: number; count: number; min: number; max: number }

function emptyAccum(): Accum {
  return { sum: 0, count: 0, min: Infinity, max: -Infinity }
}

function addToAccum(a: Accum, value: number): void {
  a.sum   += value
  a.count += 1
  a.min    = Math.min(a.min, value)
  a.max    = Math.max(a.max, value)
}

function resolve(a: Accum | undefined, agg: AggregationType): number | null {
  if (!a || a.count === 0) return null
  switch (agg) {
    case 'sum':   return a.sum
    case 'count': return a.count
    case 'avg':   return a.sum / a.count
    case 'min':   return a.min === Infinity  ? null : a.min
    case 'max':   return a.max === -Infinity ? null : a.max
  }
}

function keyStr(parts: string[]): string {
  return parts.join('\x00')
}

function cellKey(rowKey: string, colKey: string): string {
  return JSON.stringify([rowKey, colKey])
}

/**
 * Accumule les lignes d'un CSV une à une pour produire un PivotData
 * sans jamais stocker le tableau de lignes brutes en mémoire.
 */
export class PivotAccumulator {
  private config:    PivotConfig
  // rowKey → colKey → valueField → Accum
  private cells:     Map<string, Map<string, Map<string, Accum>>> = new Map()
  // pour les totaux
  private rowAccums: Map<string, Map<string, Accum>> = new Map()
  private colAccums: Map<string, Map<string, Accum>> = new Map()
  private grandAcc:  Map<string, Accum>              = new Map()
  // ordre d'insertion pour conserver le tri naturel
  private rowKeyMap: Map<string, string[]> = new Map()
  private colKeyMap: Map<string, string[]> = new Map()

  constructor(config: PivotConfig) {
    this.config = config
  }

  add(row: RawRow): void {
    const rowParts = this.config.rows.map(f    => String(row[f] ?? ''))
    const colParts = this.config.columns.map(f => String(row[f] ?? ''))
    const rk = keyStr(rowParts)
    const ck = keyStr(colParts)

    this.rowKeyMap.set(rk, rowParts)
    this.colKeyMap.set(ck, colParts)

    if (!this.cells.has(rk))  this.cells.set(rk, new Map())
    const rowData = this.cells.get(rk)!
    if (!rowData.has(ck))     rowData.set(ck, new Map())
    const cell = rowData.get(ck)!

    for (const vc of this.config.values) {
      const raw = row[vc.field]
      if (typeof raw !== 'number') continue

      this.accumulate(cell,         vc.field, raw)
      this.accumulate(this.rowMap(rk), vc.field, raw)
      this.accumulate(this.colMap(ck), vc.field, raw)
      this.accumulate(this.grandAcc,   vc.field, raw)
    }
  }

  private rowMap(rk: string): Map<string, Accum> {
    if (!this.rowAccums.has(rk)) this.rowAccums.set(rk, new Map())
    return this.rowAccums.get(rk)!
  }

  private colMap(ck: string): Map<string, Accum> {
    if (!this.colAccums.has(ck)) this.colAccums.set(ck, new Map())
    return this.colAccums.get(ck)!
  }

  private accumulate(map: Map<string, Accum>, field: string, value: number): void {
    if (!map.has(field)) map.set(field, emptyAccum())
    addToAccum(map.get(field)!, value)
  }

  result(): PivotData {
    const rowKeys = [...this.rowKeyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, parts]) => parts)

    const colKeys = [...this.colKeyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, parts]) => parts)

    const cells:     Record<string, (number | null)[]> = {}
    const rowTotals: Record<string, (number | null)[]> = {}
    const colTotals: Record<string, (number | null)[]> = {}

    const resolveMap = (map: Map<string, Accum> | undefined) =>
      this.config.values.map(vc => resolve(map?.get(vc.field), vc.aggregation))

    for (const rowParts of rowKeys) {
      const rk = keyStr(rowParts)
      rowTotals[rk] = resolveMap(this.rowAccums.get(rk))

      for (const colParts of colKeys) {
        const ck  = keyStr(colParts)
        const key = cellKey(rk, ck)
        cells[key] = resolveMap(this.cells.get(rk)?.get(ck))
      }
    }

    for (const colParts of colKeys) {
      const ck = keyStr(colParts)
      colTotals[ck] = resolveMap(this.colAccums.get(ck))
    }

    return {
      config:     this.config,
      rowKeys,
      colKeys,
      cells,
      rowTotals,
      colTotals,
      grandTotal: resolveMap(this.grandAcc),
    }
  }
}
