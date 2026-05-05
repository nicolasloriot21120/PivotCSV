import { COLORS } from '@/components/ui/PivotChart'
import type { Section } from '@/types/app.ts'
import styles from './ColorPickerPanel.module.css'

type Props = {
  seriesLabels: string[]
  chartColors:  Record<string, string>
  onUpdate:     (patch: Partial<Section>) => void
}

export function ColorPickerPanel({ seriesLabels, chartColors, onUpdate }: Props) {
  return (
    <div className={styles.panel}>
      {seriesLabels.map((label, i) => {
        const current = chartColors[label] ?? COLORS[i % COLORS.length]
        return (
          <label key={label} className={styles.swatchLabel}>
            <div
              className={styles.swatch}
              style={{ backgroundColor: current }}
            />
            <input
              type="color"
              value={current}
              onChange={e => onUpdate({ chartColors: { ...chartColors, [label]: e.target.value } })}
              className={styles.colorInput}
            />
            <span className={styles.swatchName}>{label}</span>
          </label>
        )
      })}
      <button
        onClick={() => onUpdate({ chartColors: {} })}
        className={styles.resetButton}
        title="Remettre les couleurs par défaut"
      >
        Réinitialiser
      </button>
    </div>
  )
}
