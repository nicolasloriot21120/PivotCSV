import type { DateGrouping } from '@/lib/pivot/dateGroup.ts'
import styles               from './DateGroupPicker.module.css'

const DATE_GROUPS: { key: DateGrouping; label: string; title: string }[] = [
  { key: 'week',     label: 'S',  title: 'Par semaine'   },
  { key: 'month',    label: 'M',  title: 'Par mois'      },
  { key: 'quarter',  label: 'T',  title: 'Par trimestre' },
  { key: 'semester', label: 'Sm', title: 'Par semestre'  },
  { key: 'year',     label: 'A',  title: 'Par année'     },
]

type Props = {
  value:    DateGrouping | undefined
  onChange: (g: DateGrouping | undefined) => void
}

export function DateGroupPicker({ value, onChange }: Props) {
  return (
    <div className={styles.bar}>
      {DATE_GROUPS.map(({ key, label, title }) => (
        <button
          key={key}
          title={title}
          onClick={() => onChange(value === key ? undefined : key)}
          data-active={value === key || undefined}
          className={styles.button}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
