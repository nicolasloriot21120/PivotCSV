import type { ReactNode } from 'react'
import styles from './styles.module.css'

export type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

export type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  dot?:     boolean
}

const variants: Record<BadgeVariant, string> = {
  accent:  styles.variantAccent,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
  danger:  styles.variantDanger,
  neutral: styles.variantNeutral,
}

const dots: Record<BadgeVariant, string> = {
  accent:  styles.dotAccent,
  success: styles.dotSuccess,
  warning: styles.dotWarning,
  danger:  styles.dotDanger,
  neutral: styles.dotNeutral,
}

export function Badge({ children, variant = 'neutral', dot = false }: BadgeProps) {
  return (
    <span className={[styles.base, variants[variant]].join(' ')}>
      {dot && <span className={dots[variant]} />}
      {children}
    </span>
  )
}
