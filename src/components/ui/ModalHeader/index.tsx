import type { ReactNode } from 'react'

type Props = {
  left:      ReactNode
  center?:   ReactNode
  right:     ReactNode
  height?:   number
  className?: string
}

export function ModalHeader({ left, center, right, height = 48, className }: Props) {
  return (
    <div
      className={className}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 20px',
        height,
        flexShrink:     0,
        borderBottom:   '1px solid var(--color-border)',
      }}
    >
      {left}
      {center}
      {right}
    </div>
  )
}
