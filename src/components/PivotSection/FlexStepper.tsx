type Props = {
  label:    string
  value:    number
  onChange: (v: number) => void
  min?:     number
  max?:     number
}

export function FlexStepper({ label, value, onChange, min = 1, max = 20 }: Props) {
  const btnCls = 'w-4 h-4 flex items-center justify-center rounded text-subtle hover:text-text hover:bg-elevated transition-colors text-[11px]'
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[10px] text-subtle mr-0.5">{label}</span>
      <button className={btnCls} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="w-4 text-center tabular-nums text-[11px] text-muted">{value}</span>
      <button className={btnCls} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  )
}
