import { useState, useRef, useEffect } from 'react'
import { Palette, Check }              from 'lucide-react'
import styles                          from './styles.module.css'

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
    <div ref={ref} className={styles.root}>
      <button
        onClick={() => setOpen(o => !o)}
        data-open={open || undefined}
        className={styles.trigger}
      >
        <Palette size={13} />
        <span>{current?.label ?? '—'}</span>
      </button>

      {open && (
        <div className={styles.menu}>
          {themes.map(t => {
            const active = value === t.id
            return (
              <button
                key={t.id}
                onClick={() => { onChange(t.id); setOpen(false) }}
                data-active={active || undefined}
                className={styles.option}
              >
                <div className={styles.swatchRow}>
                  {t.swatches.map((color, i) => (
                    <span
                      key={i}
                      className={styles.swatch}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className={styles.optionLabel}>{t.label}</span>
                {active && <Check size={12} className={styles.checkIcon} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
