import { X } from 'lucide-react'

type Props = {
  onClick:    () => void
  title?:     string
  size?:      number
  colorIdle?: string
  colorHover?: string
}

export function CloseButton({
  onClick,
  title       = 'Fermer',
  size        = 18,
  colorIdle   = '#64748b',
  colorHover  = 'white',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        background:     'transparent',
        border:         'none',
        color:          colorIdle,
        cursor:         'pointer',
        padding:        4,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        lineHeight:     1,
        transition:     'color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = colorHover }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = colorIdle }}
    >
      <X size={size} />
    </button>
  )
}
