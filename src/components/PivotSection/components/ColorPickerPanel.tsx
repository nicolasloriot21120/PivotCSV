import { COLORS } from '@/components/ui/PivotChart'
import type { Section } from '@/types/app'

type Props = {
  seriesLabels: string[]
  chartColors:  Record<string, string>
  onUpdate:     (patch: Partial<Section>) => void
}

export function ColorPickerPanel({ seriesLabels, chartColors, onUpdate }: Props) {
  return (
    <div className="flex flex-wrap gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-elevated/50">
      {seriesLabels.map((label, i) => {
        const current = chartColors[label] ?? COLORS[i % COLORS.length]
        return (
          <label key={label} className="flex items-center gap-1.5 cursor-pointer group">
            <div
              className="w-5 h-5 rounded-sm border border-white/20 flex-shrink-0 ring-offset-1 group-hover:ring-2 group-hover:ring-accent/50 transition-all"
              style={{ backgroundColor: current }}
            />
            <input
              type="color"
              value={current}
              onChange={e => onUpdate({ chartColors: { ...chartColors, [label]: e.target.value } })}
              className="sr-only"
            />
            <span className="text-[11px] text-muted max-w-[100px] truncate">{label}</span>
          </label>
        )
      })}
      <button
        onClick={() => onUpdate({ chartColors: {} })}
        className="text-[10px] text-subtle hover:text-danger transition-colors ml-auto"
        title="Remettre les couleurs par défaut"
      >
        Réinitialiser
      </button>
    </div>
  )
}
