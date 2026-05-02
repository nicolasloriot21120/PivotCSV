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
        background:     disabled ? 'transparent' : isHot ? 'rgba(51,65,85,0.9)' : 'rgba(30,41,59,0.9)',
        border:         `1px solid ${disabled ? 'transparent' : '#334155'}`,
        color:          disabled ? '#1e293b' : isHot ? 'white' : '#94a3b8',
        transition:     'background 0.15s, color 0.15s',
      }}
    >
      <Icon size={20} />
    </button>
  )
}
