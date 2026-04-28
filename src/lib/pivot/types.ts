export type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max'

export type PivotValueConfig = {
  field:       string
  aggregation: AggregationType
  label?:      string
}

export type PivotConfig = {
  rows:    string[]
  columns: string[]
  values:  PivotValueConfig[]
}

export type PivotData = {
  config:     PivotConfig
  /** Combinaisons uniques de valeurs pour les champs "lignes", triées. */
  rowKeys:    string[][]
  /** Combinaisons uniques de valeurs pour les champs "colonnes", triées. */
  colKeys:    string[][]
  /**
   * Cellule individuelle.
   * Clé = JSON.stringify([rowKeyStr, colKeyStr])
   * Valeur = tableau de nombres (un par PivotValueConfig), null si absent.
   */
  cells:      Record<string, (number | null)[]>
  /** Total par ligne — clé = rowKeyStr */
  rowTotals:  Record<string, (number | null)[]>
  /** Total par colonne — clé = colKeyStr */
  colTotals:  Record<string, (number | null)[]>
  grandTotal: (number | null)[]
}
