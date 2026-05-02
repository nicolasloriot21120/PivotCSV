import type { HTMLAttributes, ReactNode } from 'react'
import styles from './styles.module.css'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children:  ReactNode
  glow?:     boolean
  elevated?: boolean
  padding?:  'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: undefined,
  sm:   styles.paddingSm,
  md:   styles.paddingMd,
  lg:   styles.paddingLg,
}

export function Card({
  children,
  glow     = false,
  elevated = false,
  padding  = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[
        styles.base,
        elevated ? styles.elevated : styles.surface,
        glow && styles.glow,
        paddings[padding],
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
