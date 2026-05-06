import styles from './PivotTableToolbar.module.css'

export type PivotTableToolbarProps = {
  hasRowGroups:       boolean
  hasColGroups:       boolean
  rowHasClosed:       boolean
  colHasClosed:       boolean
  allRowGroupKeys:    string[]
  allColGroupKeys:    string[]
  onSetCollapsedRows: (pks: string[]) => void
  onSetCollapsedCols: (pks: string[]) => void
}

export function PivotTableToolbar({
  hasRowGroups, hasColGroups,
  rowHasClosed, colHasClosed,
  allRowGroupKeys, allColGroupKeys,
  onSetCollapsedRows, onSetCollapsedCols,
}: PivotTableToolbarProps) {
  if (!hasRowGroups && !hasColGroups) return null

  return (
    <div className={styles.toolbar}>
      {hasRowGroups && (
        <button
          onClick={() => rowHasClosed ? onSetCollapsedRows([]) : onSetCollapsedRows(allRowGroupKeys)}
          data-active={rowHasClosed || undefined}
          className={styles.toggleButton}
        >
          <span className={styles.toggleDot} />
          Lignes — {rowHasClosed ? 'Ouvrir' : 'Fermer'}
        </button>
      )}
      {hasColGroups && (
        <button
          onClick={() => colHasClosed ? onSetCollapsedCols([]) : onSetCollapsedCols(allColGroupKeys)}
          data-active={colHasClosed || undefined}
          className={styles.toggleButton}
        >
          <span className={styles.toggleDot} />
          Colonnes — {colHasClosed ? 'Ouvrir' : 'Fermer'}
        </button>
      )}
    </div>
  )
}
