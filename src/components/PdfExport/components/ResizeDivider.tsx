type Props = {
  direction: 'horizontal' | 'vertical'
  onResize:  (delta: number) => void
}

export function ResizeDivider({ direction, onResize }: Props) {
  const isHorizontal = direction === 'horizontal'

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    let lastX = e.clientX
    let lastY = e.clientY

    const onMove = (ev: PointerEvent) => {
      const delta = isHorizontal ? ev.clientX - lastX : ev.clientY - lastY
      lastX = ev.clientX
      lastY = ev.clientY
      if (delta !== 0) onResize(delta)
    }

    const onUp = () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        flexShrink:   0,
        width:        isHorizontal ? 4 : '100%',
        height:       isHorizontal ? '100%' : 4,
        background:   'transparent',
        cursor:       isHorizontal ? 'col-resize' : 'row-resize',
        transition:   'background 0.15s',
        zIndex:       10,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.4)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    />
  )
}
