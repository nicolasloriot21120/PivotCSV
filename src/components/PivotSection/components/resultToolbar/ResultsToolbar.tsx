import {
  BarChart2, LineChart, PieChart,
  Columns2, Rows2, Palette, ArrowLeftRight,
} from 'lucide-react'

import type { ChartType } from '@/components/ui/PivotChart'
import type { Section }   from '@/types/app.ts'
import { FlexStepper }    from '@/components/PivotSection/components/flexStepper/FlexStepper.tsx'
import shared             from '@/styles/shared.module.css'
import styles             from './ResultsToolbar.module.css'

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

const SCALE_TITLES: Record<'none' | 'K' | 'M' | 'G', string> = {
  none: 'Valeur brute',
  K:    'Milliers',
  M:    'Millions',
  G:    'Milliards',
}

export function ResultsToolbar({
  section,
  showRowTotals, showColTotals, showColorPicker, canTranspose,
  onUpdate, onToggleRowTotals, onToggleColTotals, onToggleColorPicker,
}: Props) {
  const isHorizontal = section.chartLayout === 'horizontal'

  const chartTypeBtn = (type: ChartType, Icon: React.ElementType, title: string) => (
    <button
      key={type}
      title={title}
      onClick={() => onUpdate({ chartType: type })}
      data-active={section.chartType === type || undefined}
      className={styles.iconToggle}
    >
      <Icon size={13} />
    </button>
  )

  return (
    <div className={styles.toolbar}>

      {/* Gauche : toggles totaux + format valeurs */}
      <div className={styles.toolbarGroup}>
        {([
          { label: 'Totaux lignes',   value: showRowTotals, toggle: onToggleRowTotals },
          { label: 'Totaux colonnes', value: showColTotals, toggle: onToggleColTotals },
        ] as const).map(({ label, value, toggle }) => (
          <button
            key={label}
            onClick={toggle}
            data-active={value || undefined}
            className={styles.labelToggle}
          >
            <span className={styles.labelToggleDot} />
            {label}
          </button>
        ))}

        <div className={shared.toolbarDivider} />

        {/* Échelle */}
        <div className={styles.buttonRow}>
          {(['none', 'K', 'M', 'G'] as const).map(s => (
            <button
              key={s}
              title={SCALE_TITLES[s]}
              onClick={() => onUpdate({ valueScale: s })}
              data-active={section.valueScale === s || undefined}
              className={styles.scaleToggle}
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
      <div className={styles.toolbarGroupTight}>

        {/* Type de graphique */}
        <div className={styles.buttonRow}>
          {chartTypeBtn('bar',  BarChart2, 'Barres')}
          {chartTypeBtn('line', LineChart, 'Lignes')}
          {chartTypeBtn('pie',  PieChart,  'Camembert')}
        </div>

        {/* Transposer lignes ↔ colonnes dans le graphique */}
        {canTranspose && (
          <button
            title="Intervertir lignes/colonnes dans le graphique"
            onClick={() => onUpdate({ chartTranspose: !section.chartTranspose })}
            data-active={section.chartTranspose || undefined}
            className={styles.iconToggle}
          >
            <ArrowLeftRight size={13} />
          </button>
        )}

        <div className={shared.toolbarDivider} />

        {/* Layout */}
        <div className={styles.buttonRow}>
          {([
            { layout: 'horizontal' as const, Icon: Columns2, title: 'Côte à côte' },
            { layout: 'vertical'   as const, Icon: Rows2,    title: 'Empilé' },
          ]).map(({ layout, Icon, title }) => (
            <button
              key={layout}
              title={title}
              onClick={() => onUpdate({ chartLayout: layout })}
              data-active={section.chartLayout === layout || undefined}
              className={styles.iconToggle}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Flex (seulement en mode horizontal) */}
        {isHorizontal && (
          <>
            <div className={shared.toolbarDivider} />
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

        <div className={shared.toolbarDivider} />

        {/* Color picker toggle */}
        <button
          title="Couleurs des séries"
          onClick={onToggleColorPicker}
          data-active={showColorPicker || undefined}
          className={styles.iconToggle}
        >
          <Palette size={13} />
        </button>
      </div>
    </div>
  )
}
