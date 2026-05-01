import html2canvas from 'html2canvas-pro'

export async function captureBlock(sectionId: string, type: 'table' | 'chart'): Promise<string> {
  const el = document.querySelector(`[data-export-target="${sectionId}-${type}"]`) as HTMLElement | null
  if (!el) throw new Error(`Element not found: ${sectionId}-${type}`)
  const canvas = await html2canvas(el, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
  })
  return canvas.toDataURL('image/png')
}
