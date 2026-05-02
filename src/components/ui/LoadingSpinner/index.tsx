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
  background = 'var(--color-overlay)',
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
      <LoadingSpinner
        size={32}
        thickness={3}
        color="var(--color-modal-border-strong)"
        accentColor="var(--color-accent)"
      />
      {label && (
        <span style={{ color: 'var(--color-modal-text-muted)', fontSize: 14 }}>
          {label}
        </span>
      )}
    </div>
  )
}
