export type ValueScale = 'none' | 'K' | 'M' | 'G'

const DIVISOR: Record<ValueScale, number> = {
  none: 1,
  K:    1_000,
  M:    1_000_000,
  G:    1_000_000_000,
}

const SUFFIX: Record<ValueScale, string> = {
  none: '',
  K:    ' k',
  M:    ' M',
  G:    ' G',
}

export function makeFormatter(scale: ValueScale, decimals: number): (v: number) => string {
  const div = DIVISOR[scale]
  const suf = SUFFIX[scale]
  return (v: number) =>
    (v / div).toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suf
}
