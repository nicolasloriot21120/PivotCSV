import type { ReactNode } from 'react'

export type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

export type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  dot?:     boolean
}

const variants: Record<BadgeVariant, string> = {
  accent:  'bg-accent/15  text-accent-hi  border-accent/30',
  success: 'bg-success/15 text-success    border-success/30',
  warning: 'bg-warning/15 text-warning    border-warning/30',
  danger:  'bg-danger/15  text-danger     border-danger/30',
  neutral: 'bg-elevated   text-muted      border-border',
}

const dots: Record<BadgeVariant, string> = {
  accent:  'bg-accent-hi',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  neutral: 'bg-muted',
}

export function Badge({ children, variant = 'neutral', dot = false }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium',
      variants[variant],
    ].join(' ')}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />}
      {children}
    </span>
  )
}
