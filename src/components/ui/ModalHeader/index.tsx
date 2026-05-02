import type { ReactNode } from 'react'

type Props = {
  left:    ReactNode
  center?: ReactNode
  right:   ReactNode
  height?: number
}

export function ModalHeader({ left, center, right, height = 48 }: Props) {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 20px',
        height,
        flexShrink:     0,
        borderBottom:   '1px solid #1e293b',
      }}
    >
      {left}
      {center}
      {right}
    </div>
  )
}
