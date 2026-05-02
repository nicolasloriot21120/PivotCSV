import type { ReactNode, MouseEvent } from 'react'

type Props = {
  onClick:   (e: MouseEvent<HTMLButtonElement>) => void
  title:     string
  children:  ReactNode
  size?:     number
  color?:    string
  fontSize?: number
}

export function SmallIconButton({
  onClick,
  title,
  children,
  size     = 20,
  color    = '#94a3b8',
  fontSize = 10,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width:          size,
        height:         size,
        borderRadius:   3,
        background:     'rgba(15,23,42,0.85)',
        border:         '1px solid #334155',
        color,
        fontSize,
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        lineHeight:     1,
        padding:        0,
      }}
    >
      {children}
    </button>
  )
}
