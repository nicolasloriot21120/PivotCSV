import type { PivotData, AggregationType } from '@/lib/pivot/types'

// =============================================================================
// CLÉS
// =============================================================================

const keyStr  = (parts: string[]) => parts.join('\x00')
const cellKey = (rk: string, ck: string) => JSON.stringify([rk, ck])

// Symboles affichés sur les boutons d'agrégation
export const AGG_SYM: Record<AggregationType, string> = {
  sum: 'Σ', count: '#', avg: 'Ø', min: '▼', max: '▲',
}

// Formate un nombre pour l'affichage FR
function fmt(v: number | null, agg: AggregationType): string {
  if (v === null) return '—'
  return agg === 'count'
    ? v.toLocaleString('fr-FR')
    : v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

// =============================================================================
// AGRÉGATION SUR UN GROUPE COLLAPSÉ
// =============================================================================

function aggVals(vals: (number | null)[], type: AggregationType): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  if (!nums.length) return null
  switch (type) {
    case 'sum':   return nums.reduce((a, b) => a + b, 0)
    case 'count': return nums.reduce((a, b) => a + b, 0)
    case 'avg':   return nums.reduce((a, b) => a + b, 0) / nums.length
    case 'min':   return Math.min(...nums)
    case 'max':   return Math.max(...nums)
  }
}

// =============================================================================
// ARBRE DE GROUPAGE (TreeNode)
// =============================================================================

type GroupNode = {
  type:        'group'
  prefixKey:   string
  label:       string
  depth:       number
  allLeafKeys: string[][]
  collapsed:   boolean
  children:    TreeNode[]
}

type LeafNode = {
  type: 'leaf'
  key:  string[]
}

export type TreeNode = GroupNode | LeafNode

function buildTree(keys: string[][], depth: number, collapsed: Set<string>): TreeNode[] {
  if (!keys.length) return []
  const nF = keys[0].length

  if (depth >= nF - 1) return keys.map(k => ({ type: 'leaf' as const, key: k }))

  const groups = new Map<string, string[][]>()
  for (const k of keys) {
    const g = k[depth]
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(k)
  }

  return [...groups.entries()].map(([label, gk]) => {
    const pk = keyStr(gk[0].slice(0, depth + 1))
    return {
      type:        'group' as const,
      prefixKey:   pk,
      label,
      depth,
      allLeafKeys: gk,
      collapsed:   collapsed.has(pk),
      children:    buildTree(gk, depth + 1, collapsed),
    }
  })
}

function countVis(node: TreeNode): number {
  if (node.type === 'leaf') return 1
  if (node.collapsed) return 1
  return 1 + node.children.reduce((s, c) => s + countVis(c), 0)
}

function visSlots(nodes: TreeNode[]): TreeNode[] {
  const r: TreeNode[] = []
  for (const n of nodes) {
    r.push(n)
    if (n.type === 'group' && !n.collapsed) r.push(...visSlots(n.children))
  }
  return r
}

function leafKeys(node: TreeNode): string[][] {
  return node.type === 'leaf' ? [node.key] : node.allLeafKeys
}

export function allGroupKeys(nodes: TreeNode[]): string[] {
  const keys: string[] = []
  for (const n of nodes) {
    if (n.type === 'group') {
      keys.push(n.prefixKey)
      keys.push(...allGroupKeys(n.children))
    }
  }
  return keys
}

// =============================================================================
// EN-TÊTES DE COLONNES MULTI-NIVEAUX
// =============================================================================

export type HCell = {
  label:     string
  colSpan:   number
  rowSpan:   number
  prefixKey: string | null
  collapsed: boolean
}

function buildColHeader(colTree: TreeNode[], nCF: number, nVal: number): HCell[][] {
  if (!nCF) return []

  const rows: HCell[][] = Array.from({ length: nCF }, () => [])

  function visit(nodes: TreeNode[], d: number) {
    for (const n of nodes) {
      const lc = countVis(n)
      if (n.type === 'leaf') {
        rows[d].push({
          label:     n.key[n.key.length - 1],
          colSpan:   nVal,
          rowSpan:   nCF - d,
          prefixKey: null,
          collapsed: false,
        })
      } else {
        rows[d].push({
          label:     n.label,
          colSpan:   lc * nVal,
          rowSpan:   n.collapsed ? nCF - d : 1,
          prefixKey: n.prefixKey,
          collapsed: n.collapsed,
        })
        if (!n.collapsed) {
          rows[d + 1].push({
            label:     'Σ',
            colSpan:   nVal,
            rowSpan:   nCF - (d + 1),
            prefixKey: null,
            collapsed: false,
          })
          visit(n.children, d + 1)
        }
      }
    }
  }

  visit(colTree, 0)
  return rows
}

// =============================================================================
// HOOK
// =============================================================================

export type UsePivotTableProps = {
  data:               PivotData
  collapsedRowGroups: string[]
  collapsedColGroups: string[]
  formatValue?:       (v: number) => string
}

export function usePivotTable({
  data,
  collapsedRowGroups,
  collapsedColGroups,
  formatValue,
}: UsePivotTableProps) {
  const { config, rowKeys, colKeys, cells, rowTotals, colTotals } = data
  const { values } = config

  const fmtCell = (v: number | null, agg: AggregationType) => {
    if (v === null) return '—'
    if (formatValue && agg !== 'count') return formatValue(v)
    return fmt(v, agg)
  }

  const nVal     = values.length
  const nRF      = config.rows.length
  const nCF      = config.columns.length
  const multiVal = nVal > 1
  const hasCols  = nCF > 0

  const collapsedR = new Set(collapsedRowGroups)
  const collapsedC = new Set(collapsedColGroups)

  const rowTree = buildTree(rowKeys, 0, collapsedR)
  const colTree = hasCols ? buildTree(colKeys, 0, collapsedC) : []

  const rowSlots = visSlots(rowTree)
  const colSlots = hasCols ? visSlots(colTree) : []

  const colHdrs = buildColHeader(colTree, nCF, nVal)

  const colHeaderRows = hasCols ? nCF : 1
  const nHeaderRows   = colHeaderRows + (multiVal ? 1 : 0)

  const hasRowGroups = nRF > 1
  const hasColGroups = nCF > 1

  const getCellVals = (rs: TreeNode, cs: TreeNode): (number | null)[] => {
    const rL = leafKeys(rs)
    const cL = leafKeys(cs)
    return values.map((vc, vi) => {
      const vals = rL.flatMap(rp => cL.map(cp =>
        cells[cellKey(keyStr(rp), keyStr(cp))]?.[vi] ?? null
      ))
      return aggVals(vals, vc.aggregation)
    })
  }

  const getRowTotalVals = (rs: TreeNode): (number | null)[] => {
    const rL = leafKeys(rs)
    return values.map((vc, vi) =>
      aggVals(rL.map(rp => rowTotals[keyStr(rp)]?.[vi] ?? null), vc.aggregation)
    )
  }

  const getColTotalVals = (cs: TreeNode): (number | null)[] => {
    const cL = leafKeys(cs)
    return values.map((vc, vi) =>
      aggVals(cL.map(cp => colTotals[keyStr(cp)]?.[vi] ?? null), vc.aggregation)
    )
  }

  return {
    rowTree,
    colTree,
    rowSlots,
    colSlots,
    colHdrs,
    nVal,
    nRF,
    nCF,
    multiVal,
    hasCols,
    hasRowGroups,
    hasColGroups,
    nHeaderRows,
    colHeaderRows,
    getCellVals,
    getRowTotalVals,
    getColTotalVals,
    fmtCell,
    allRowGroupKeys: allGroupKeys(rowTree),
    allColGroupKeys: allGroupKeys(colTree),
  }
}
