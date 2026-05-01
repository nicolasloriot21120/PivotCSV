import type { DateGrouping } from '@/lib/pivot/dateGroup'

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
    <div className="flex items-center gap-0.5 ml-1">
      {DATE_GROUPS.map(({ key, label, title }) => (
        <button
          key={key}
          title={title}
          onClick={() => onChange(value === key ? undefined : key)}
          className={[
            'text-[9px] font-semibold px-1 py-0.5 rounded border transition-all duration-100',
            value === key
              ? 'bg-accent/20 border-accent/50 text-accent-hi'
              : 'bg-surface border-border text-subtle hover:text-text hover:border-border-strong',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
