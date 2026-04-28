export type CellValue = string | number | boolean | null

export type RawRow = Record<string, CellValue>

export type ParseError = {
  row?:     number
  col?:     string
  message:  string
  severity: 'error' | 'warning'
}

export type ValidationResult<T> = {
  valid:  boolean
  data:   T[]
  errors: ParseError[]
}

export type LoadResult<T> = {
  ok:     boolean
  data:   T[]
  errors: ParseError[]
}

export type StreamResult = {
  rowCount: number
  errors:   ParseError[]
}

// ── CSV-specific ─────────────────────────────────────────────────────────────

export type Delimiter = ',' | ';' | '\t' | '|'

export type CSVMeta = {
  delimiter:   Delimiter
  hasHeader:   boolean
  rowCount:    number
  columnCount: number
}

export type CSVParseResult = {
  headers: string[]
  rows:    RawRow[]
  meta:    CSVMeta
  errors:  ParseError[]
}
