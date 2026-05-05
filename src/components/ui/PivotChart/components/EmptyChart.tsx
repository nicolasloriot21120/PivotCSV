import styles from './EmptyChart.module.css'

export function EmptyChart() {
  return (
    <div className={styles.empty}>
      Aucune donnée à afficher
    </div>
  )
}
