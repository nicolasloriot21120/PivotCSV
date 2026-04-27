import type { ButtonHTMLAttributes, ReactNode } from 'react'

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
  primary:
    'bg-gradient-to-r from-accent-lo to-accent text-white shadow-[0_0_16px_#6366F130] ' +
    'hover:shadow-[0_0_24px_#6366F155] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-elevated border border-border-strong text-text ' +
    'hover:border-accent/50 hover:bg-elevated/80 hover:text-accent-hi active:brightness-90',
  ghost:
    'text-muted hover:text-text hover:bg-elevated active:bg-surface',
  danger:
    'bg-danger/10 border border-danger/30 text-danger ' +
    'hover:bg-danger/20 hover:border-danger/60 active:brightness-90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7  px-3   text-xs  gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-9  px-4   text-sm  gap-2   rounded-[var(--radius-md)]',
  lg: 'h-11 px-5   text-base gap-2.5 rounded-[var(--radius-md)]',
}

export function Button({
  variant = 'primary',
  size    = 'md',
  icon,
  iconEnd,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        'disabled:opacity-40 disabled:pointer-events-none',
        'cursor-pointer select-none',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon
      }
      {children && <span>{children}</span>}
      {!loading && iconEnd}
    </button>
  )
}
