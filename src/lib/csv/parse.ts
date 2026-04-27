import type { CellValue, CSVParseResult, Delimiter, ParseError, RawRow } from './types'
import { detectDelimiter } from './detect'

function inferType(raw: string): CellValue {
  if (raw === '') return null
  if (raw === 'true')  return true
  if (raw === 'false') return false
  const n = Number(raw)
  if (!isNaN(n)) return n
  return raw
}

/** Découpe une ligne en tenant compte des champs entre guillemets. */
function splitLine(line: string, delimiter: Delimiter): string[] {
  const result: string[] = []
  let current  = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(text: string): CSVParseResult {
  const delimiter = detectDelimiter(text)
  const lines     = text.split(/\r?\n/).filter(l => l.trim() !== '')
  const errors: ParseError[] = []

  if (lines.length === 0) {
    return {
      headers: [],
      rows:    [],
      meta:    { delimiter, hasHeader: false, rowCount: 0, columnCount: 0 },
      errors,
    }
  }

  const headers = splitLine(lines[0], delimiter)
  const rows: RawRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter)

    if (cells.length !== headers.length) {
      errors.push({
        row:      i + 1,
        message:  `${cells.length} colonnes trouvées, ${headers.length} attendues`,
        severity: 'warning',
      })
    }

    const row: RawRow = {}
    headers.forEach((h, j) => { row[h] = inferType(cells[j] ?? '') })
    rows.push(row)
  }

  return {
    headers,
    rows,
    meta: { delimiter, hasHeader: true, rowCount: rows.length, columnCount: headers.length },
    errors,
  }
}
