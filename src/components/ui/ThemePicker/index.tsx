import { useState, useRef, useEffect } from 'react'
import { Palette, Check }              from 'lucide-react'

export type ThemeOption<T extends string = string> = {
  id:       T
  label:    string
  swatches: [string, string, string]
}

export type ThemePickerProps<T extends string = string> = {
  themes:   ThemeOption<T>[]
  value:    T
  onChange: (id: T) => void
}

export function ThemePicker<T extends string>({ themes, value, onChange }: ThemePickerProps<T>) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = themes.find(t => t.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={[
          'flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)]',
          'border text-xs font-medium transition-all duration-150',
          open
            ? 'bg-accent/15 border-accent/40 text-accent-hi'
            : 'bg-elevated border-border text-muted hover:border-border-strong hover:text-text',
        ].join(' ')}
      >
        <Palette size={13} />
        <span>{current?.label ?? '—'}</span>
      </button>

      {open && (
        <div className={[
          'absolute right-0 top-full mt-2 z-50 min-w-[200px]',
          'rounded-[var(--radius-lg)] border border-border',
          'bg-surface shadow-[var(--shadow-elevated)]',
          'p-1.5 flex flex-col gap-0.5',
        ].join(' ')}>
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { onChange(t.id); setOpen(false) }}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]',
                'text-xs font-medium transition-all duration-150 text-left w-full',
                value === t.id
                  ? 'bg-accent/10 text-accent-hi'
                  : 'text-muted hover:bg-elevated hover:text-text',
              ].join(' ')}
            >
              <div className="flex gap-1 flex-shrink-0">
                {t.swatches.map((color, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full border border-white/10 flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="flex-1">{t.label}</span>
              {value === t.id && <Check size={12} className="text-accent flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
