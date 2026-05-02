import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './styles.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?:    ButtonSize
  icon?:    ReactNode
  iconEnd?: ReactNode
  loading?: boolean
  children?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:   styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost:     styles.variantGhost,
  danger:    styles.variantDanger,
}

const sizes: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
}

export function Button({
  variant = 'primary',
  size    = 'md',
  icon,
  iconEnd,
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[styles.base, variants[variant], sizes[size], className].filter(Boolean).join(' ')}
    >
      {loading
        ? <span className={styles.spinner} />
        : icon
      }
      {children && <span>{children}</span>}
      {!loading && iconEnd}
    </button>
  )
}
