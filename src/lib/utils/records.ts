import type { RawRow } from '@/lib/loader'

/**
 * Parcourt un tableau de lignes et retourne toutes les valeurs string distinctes
 * par colonne, triées alphabétiquement.
 * Utilisable indépendamment du format source (CSV, JSON, API...).
 */
export function collectDistinctStringValues(rows: RawRow[]): Record<string, string[]> {
  const seen: Record<string, Set<string>> = {}
  for (const row of rows) {
    for (const [key, val] of Object.entries(row)) {
      if (!seen[key]) seen[key] = new Set()
      if (typeof val === 'string' && val !== '') seen[key].add(val)
    }
  }
  const out: Record<string, string[]> = {}
  for (const [key, set] of Object.entries(seen)) {
    out[key] = [...set].sort()
  }
  return out
}
