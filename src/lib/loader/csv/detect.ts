import type { Delimiter } from './types'

const CANDIDATES: Delimiter[] = [',', ';', '\t', '|']

export function detectDelimiter(text: string): Delimiter {
  const sample = text.split('\n').slice(0, 10).join('\n')

  const scores = CANDIDATES.map(d => {
    const counts = sample
      .split('\n')
      .filter(l => l.trim() !== '')
      .map(l => l.split(d).length - 1)

    const mean     = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length

    return { d, mean, variance }
  })

  const candidates = scores.filter(s => s.mean > 0)
  if (candidates.length === 0) return ','

  // Un délimiteur dont le compte est parfaitement stable (variance = 0) est
  // prioritaire — évite de confondre séparateur décimal "," avec délimiteur.
  const stable = candidates.filter(s => s.variance === 0)
  if (stable.length > 0) return stable.sort((a, b) => b.mean - a.mean)[0].d

  return candidates.sort((a, b) => b.mean - a.mean || a.variance - b.variance)[0].d
}
