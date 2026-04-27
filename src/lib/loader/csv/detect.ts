import type { Delimiter } from './types'

const CANDIDATES: Delimiter[] = [',', ';', '\t', '|']

export function detectDelimiter(text: string): Delimiter {
  const sample = text.split('\n').slice(0, 10).join('\n')

  // Compte les occurrences de chaque candidat sur les premières lignes.
  // Le délimiteur attendu est celui dont le nombre par ligne est le plus
  // régulier (faible écart-type) et le plus élevé.
  const scores = CANDIDATES.map(d => {
    const counts = sample
      .split('\n')
      .filter(l => l.trim() !== '')
      .map(l => l.split(d).length - 1)

    const mean = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length

    return { d, mean, variance }
  })

  // Privilégier fort average + faible variance
  return scores
    .filter(s => s.mean > 0)
    .sort((a, b) => b.mean - a.mean || a.variance - b.variance)[0]?.d ?? ','
}
