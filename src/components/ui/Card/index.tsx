import type { HTMLAttributes, ReactNode } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children:  ReactNode
  glow?:     boolean
  elevated?: boolean
  padding?:  'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

export function Card({
  children,
  glow     = false,
  elevated = false,
  padding  = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[
        'rounded-[var(--radius-lg)] border border-border',
        elevated
          ? 'bg-elevated shadow-[var(--shadow-elevated)]'
          : 'bg-surface shadow-[var(--shadow-card)]',
        glow && 'shadow-[var(--shadow-glow)]',
        paddings[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
