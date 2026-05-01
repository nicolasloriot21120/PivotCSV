export type DateGrouping = 'week' | 'month' | 'quarter' | 'semester' | 'year'

// ─── Détection ────────────────────────────────────────────────────────────────

export function isDateLike(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(s)      // ISO 8601
    || /^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(s)  // DD/MM/YYYY ou DD-MM-YYYY
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function parseDate(raw: string): Date | null {
  // ISO et formats reconnus nativement
  let d = new Date(raw)
  if (!isNaN(d.getTime())) return d

  // DD/MM/YYYY ou DD-MM-YYYY
  const m = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (m) {
    d = new Date(`${m[3]}-${m[2]}-${m[1]}`)
    if (!isNaN(d.getTime())) return d
  }

  return null
}

// ─── Numéro de semaine ISO ────────────────────────────────────────────────────

function isoWeek(d: Date): [week: number, year: number] {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return [week, utc.getUTCFullYear()]
}

// ─── Transformation ───────────────────────────────────────────────────────────
// Les clés générées sont triables alphabétiquement (format ISO).

export function groupDate(raw: string, group: DateGrouping): string {
  const d = parseDate(raw)
  if (!d) return raw

  const year  = d.getFullYear()
  const month = d.getMonth() + 1

  switch (group) {
    case 'week': {
      const [w, y] = isoWeek(d)
      return `${y}-W${String(w).padStart(2, '0')}`
    }
    case 'month':
      return `${year}-${String(month).padStart(2, '0')}`
    case 'quarter':
      return `${year}-Q${Math.ceil(month / 3)}`
    case 'semester':
      return `${year}-H${month <= 6 ? 1 : 2}`
    case 'year':
      return String(year)
  }
}
