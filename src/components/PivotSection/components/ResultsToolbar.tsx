import {
  BarChart2, LineChart, PieChart,
  Columns2, Rows2, Palette, ArrowLeftRight,
} from 'lucide-react'

import type { ChartType } from '@/components/ui/PivotChart'
import type { Section }   from '@/types/app'
import { FlexStepper }   from './FlexStepper'

type Props = {
  section:            Section
  showRowTotals:      boolean
  showColTotals:      boolean
  showColorPicker:    boolean
  seriesLabels:       string[]
  canTranspose:       boolean
  onUpdate:           (patch: Partial<Section>) => void
  onToggleRowTotals:  () => void
  onToggleColTotals:  () => void
  onToggleColorPicker: () => void
}

export function ResultsToolbar({
  section,
  showRowTotals, showColTotals, showColorPicker,
  seriesLabels, canTranspose,
  onUpdate, onToggleRowTotals, onToggleColTotals, onToggleColorPicker,
}: Props) {
  const isHorizontal = section.chartLayout === 'horizontal'

  const chartTypeBtn = (type: ChartType, Icon: React.ElementType, title: string) => (
    <button
      key={type}
      title={title}
      onClick={() => onUpdate({ chartType: type })}
      className={[
        'p-1.5 rounded-[var(--radius-sm)] border transition-all duration-150',
        section.chartType === type
          ? 'bg-accent/10 border-accent/40 text-accent-hi'
          : 'bg-elevated border-border text-subtle hover:text-text',
      ].join(' ')}
    >
      <Icon size={13} />
    </button>
  )

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">

      {/* Gauche : toggles totaux + format valeurs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { label: 'Totaux lignes',   value: showRowTotals, toggle: onToggleRowTotals },
          { label: 'Totaux colonnes', value: showColTotals, toggle: onToggleColTotals },
        ] as const).map(({ label, value, toggle }) => (
          <button
            key={label}
            onClick={toggle}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)]',
              'text-[11px] font-medium border transition-all duration-150',
              value
                ? 'bg-accent/10 border-accent/40 text-accent-hi'
                : 'bg-elevated border-border text-subtle hover:text-text',
            ].join(' ')}
          >
            <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', value ? 'bg-accent' : 'bg-border-strong'].join(' ')} />
            {label}
          </button>
        ))}

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Échelle */}
        <div className="flex items-center gap-1">
          {(['none', 'K', 'M', 'G'] as const).map(s => (
            <button
              key={s}
              title={s === 'none' ? 'Valeur brute' : s === 'K' ? 'Milliers' : s === 'M' ? 'Millions' : 'Milliards'}
              onClick={() => onUpdate({ valueScale: s })}
              className={[
                'px-1.5 py-1 rounded-[var(--radius-sm)] border text-[11px] font-medium transition-all duration-150',
                section.valueScale === s
                  ? 'bg-accent/10 border-accent/40 text-accent-hi'
                  : 'bg-elevated border-border text-subtle hover:text-text',
              ].join(' ')}
            >
              {s === 'none' ? '—' : s}
            </button>
          ))}
        </div>

        <FlexStepper
          label="déc."
          value={section.valueDecimals}
          onChange={v => onUpdate({ valueDecimals: v })}
          min={0}
          max={4}
        />
      </div>

      {/* Droite : contrôles graphique */}
      <div className="flex items-center gap-1.5 flex-wrap">

        {/* Type de graphique */}
        <div className="flex items-center gap-1">
          {chartTypeBtn('bar',  BarChart2, 'Barres')}
          {chartTypeBtn('line', LineChart, 'Lignes')}
          {chartTypeBtn('pie',  PieChart,  'Camembert')}
        </div>

        {/* Transposer lignes ↔ colonnes dans le graphique */}
        {canTranspose && (
          <button
            title="Intervertir lignes/colonnes dans le graphique"
            onClick={() => onUpdate({ chartTranspose: !section.chartTranspose })}
            className={[
              'p-1.5 rounded-[var(--radius-sm)] border transition-all duration-150',
              section.chartTranspose
                ? 'bg-accent/10 border-accent/40 text-accent-hi'
                : 'bg-elevated border-border text-subtle hover:text-text',
            ].join(' ')}
          >
            <ArrowLeftRight size={13} />
          </button>
        )}

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Layout */}
        <div className="flex items-center gap-1">
          {([
            { layout: 'horizontal' as const, Icon: Columns2, title: 'Côte à côte' },
            { layout: 'vertical'   as const, Icon: Rows2,    title: 'Empilé' },
          ]).map(({ layout, Icon, title }) => (
            <button
              key={layout}
              title={title}
              onClick={() => onUpdate({ chartLayout: layout })}
              className={[
                'p-1.5 rounded-[var(--radius-sm)] border transition-all duration-150',
                section.chartLayout === layout
                  ? 'bg-accent/10 border-accent/40 text-accent-hi'
                  : 'bg-elevated border-border text-subtle hover:text-text',
              ].join(' ')}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Flex (seulement en mode horizontal) */}
        {isHorizontal && (
          <>
            <div className="w-px h-4 bg-border mx-0.5" />
            <FlexStepper
              label="T"
              value={section.tableFlex}
              onChange={v => onUpdate({ tableFlex: v })}
            />
            <FlexStepper
              label="G"
              value={section.chartFlex}
              onChange={v => onUpdate({ chartFlex: v })}
            />
          </>
        )}

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Color picker toggle */}
        <button
          title="Couleurs des séries"
          onClick={onToggleColorPicker}
          className={[
            'p-1.5 rounded-[var(--radius-sm)] border transition-all duration-150',
            showColorPicker
              ? 'bg-accent/10 border-accent/40 text-accent-hi'
              : 'bg-elevated border-border text-subtle hover:text-text',
          ].join(' ')}
        >
          <Palette size={13} />
        </button>
      </div>
    </div>
  )
}
