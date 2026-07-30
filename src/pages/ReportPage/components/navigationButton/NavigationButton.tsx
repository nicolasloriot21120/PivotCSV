import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  direction: 'prev' | 'next'
  disabled:  boolean
  onClick:   () => void
}

export function NavigationButton({ direction, disabled, onClick }: Props) {
  const [hovered, setHovered] = useState(false)
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  const isHot = hovered && !disabled

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={direction === 'prev' ? 'Précédent' : 'Suivant'}
      style={{
        position:       'absolute',
        top:            '50%',
        [direction === 'prev' ? 'left' : 'right']: 10,
        transform:      'translateY(-50%)',
        zIndex:         10,
        width:          40,
        height:         40,
        borderRadius:   8,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         disabled ? 'default' : 'pointer',
        background:     disabled
          ? 'transparent'
          : isHot
            ? 'var(--color-elevated)'
            : 'var(--color-surface)',
        border:         `1px solid ${disabled ? 'transparent' : 'var(--color-border-strong)'}`,
        boxShadow:      disabled ? 'none' : 'var(--shadow-card)',
        color:          disabled
          ? 'var(--color-subtle)'
          : isHot
            ? 'var(--color-accent)'
            : 'var(--color-muted)',
        transition:     'background 0.15s, color 0.15s',
      }}
    >
      <Icon size={20} />
    </button>
  )
}
