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
  color    = 'var(--color-modal-text-muted)',
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
        background:     'var(--color-overlay-button-translucent)',
        border:         '1px solid var(--color-modal-border-strong)',
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
