import type { CellValue, CSVParseResult, Delimiter, ParseError, RawRow } from './types'
import { detectDelimiter } from './detect'

export function inferType(raw: string): CellValue {
  if (raw === '') return null
  if (raw === 'true')  return true
  if (raw === 'false') return false
  const n = Number(raw)
  if (!isNaN(n)) return n
  return raw
}

const QUOTE_CHARS = new Set(['"', "'", '`'])

export function splitLine(line: string, delimiter: Delimiter): string[] {
  const result: string[] = []
  let current   = ''
  let quoteChar = ''

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoteChar) {
      if (ch === quoteChar) {
        if (line[i + 1] === quoteChar) { current += quoteChar; i++ }
        else quoteChar = ''
      } else {
        current += ch
      }
    } else if (QUOTE_CHARS.has(ch) && current === '') {
      quoteChar = ch
    } else if (ch === delimiter) {
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
      const hint = delimiter === ','
        ? ` — vérifiez que vos nombres décimaux utilisent "." ou exportez avec ";" comme délimiteur`
        : ''
      errors.push({ row: i + 1, message: `${cells.length} colonnes trouvées, ${headers.length} attendues${hint}`, severity: 'warning' })
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

/** Lit uniquement les premiers octets du fichier pour un aperçu rapide. */
export async function parsePreview(file: File, maxRows = 3): Promise<CSVParseResult> {
  const CHUNK  = 20 * 1024
  let text     = ''
  let offset   = 0
  const needed = maxRows + 1  // header + lignes de données

  // Lit par chunks jusqu'à avoir assez de lignes complètes
  while (offset < file.size) {
    text   += await file.slice(offset, offset + CHUNK).text()
    offset += CHUNK
    if (text.split('\n').filter(l => l.trim() !== '').length >= needed) break
  }

  // Tronque après le dernier \n pour ne pas parser une ligne partielle
  const lastNL = text.lastIndexOf('\n')
  if (lastNL !== -1) text = text.slice(0, lastNL)

  const result = parseCSV(text)
  return { ...result, rows: result.rows.slice(0, maxRows) }
}
