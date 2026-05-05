import styles from './FlexStepper.module.css'

type Props = {
  label:    string
  value:    number
  onChange: (v: number) => void
  min?:     number
  max?:     number
}

export function FlexStepper({ label, value, onChange, min = 1, max = 20 }: Props) {
  return (
    <div className={styles.stepper}>
      <span className={styles.label}>{label}</span>
      <button className={styles.button} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className={styles.value}>{value}</span>
      <button className={styles.button} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  )
}
