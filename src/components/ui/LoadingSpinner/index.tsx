type SpinnerProps = {
  size?:        number
  thickness?:   number
  color?:       string
  accentColor?: string
  speed?:       number
}

export function LoadingSpinner({
  size        = 16,
  thickness   = 2,
  color       = 'currentColor',
  accentColor = 'transparent',
  speed       = 0.7,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      style={{
        display:        'inline-block',
        width:          size,
        height:         size,
        border:         `${thickness}px solid ${color}`,
        borderTopColor: accentColor,
        borderRadius:   '50%',
        animation:      `spin ${speed}s linear infinite`,
      }}
    />
  )
}

type OverlayProps = {
  label?:      string
  background?: string
  zIndex?:     number
}

export function LoadingOverlay({
  label,
  background = 'rgba(15,23,42,0.93)',
  zIndex     = 100,
}: OverlayProps) {
  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background,
        zIndex,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            16,
      }}
    >
      <LoadingSpinner size={32} thickness={3} color="#334155" accentColor="#6366f1" />
      {label && <span style={{ color: '#94a3b8', fontSize: 14 }}>{label}</span>}
    </div>
  )
}
