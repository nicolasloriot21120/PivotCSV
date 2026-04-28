import { GenericLoader }                                        from '../GenericLoader'
import { detectDelimiter }                                       from './detect'
import { parseCSV, parsePreview, splitLine, inferType }          from './parse'
import type { CSVParseResult, Delimiter, RawRow,
              StreamResult, ValidationResult }                   from './types'

export class CSVLoader<T = RawRow> extends GenericLoader<T, CSVParseResult> {

  async parse(file: File): Promise<CSVParseResult> {
    const text = await file.text()
    return parseCSV(text)
  }

  validate(raw: CSVParseResult): ValidationResult<T> {
    return {
      valid:  raw.errors.filter(e => e.severity === 'error').length === 0,
      data:   raw.rows as T[],
      errors: raw.errors,
    }
  }

  transform(raw: CSVParseResult): T[] {
    return raw.rows as T[]
  }

  getTemplate(): string {
    return 'colonne1,colonne2,colonne3\nvaleur1,valeur2,valeur3\n'
  }

  /** Aperçu rapide : lit seulement les premiers octets, jamais le fichier entier. */
  parsePreview(file: File, maxRows = 3): Promise<CSVParseResult> {
    return parsePreview(file, maxRows)
  }

  /**
   * Streaming réel : lecture par chunks via ReadableStream.
   * Les lignes sont parsées et émises une à une — aucun RawRow[] n'est stocké.
   */
  override async stream(
    file: File,
    onRow: (row: T) => void,
    onProgress?: (percent: number) => void,
  ): Promise<StreamResult> {
    const reader    = file.stream().getReader()
    const decoder   = new TextDecoder()
    const errors    = this.validate({ headers: [], rows: [], meta: { delimiter: ',', hasHeader: false, rowCount: 0, columnCount: 0 }, errors: [] }).errors
    errors.length   = 0

    let buffer      = ''
    let headers: string[]   = []
    let delimiter: Delimiter = ','
    let rowCount    = 0
    let bytesRead   = 0
    let initialized = false

    const processLine = (line: string) => {
      if (!line.trim()) return
      const cells = splitLine(line, delimiter)
      if (cells.length !== headers.length) {
        const hint = delimiter === ','
          ? ' — vérifiez que vos nombres décimaux utilisent "." ou exportez avec ";" comme délimiteur'
          : ''
        errors.push({ row: rowCount + 2, message: `${cells.length} colonnes trouvées, ${headers.length} attendues${hint}`, severity: 'warning' })
      }
      const row: RawRow = {}
      headers.forEach((h, j) => { row[h] = inferType(cells[j] ?? '') })
      onRow(row as T)
      rowCount++
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      bytesRead += value.byteLength
      buffer    += decoder.decode(value, { stream: true })

      // Découpe uniquement les lignes complètes — garde le reste dans le buffer
      const lastNL = buffer.lastIndexOf('\n')
      if (lastNL === -1) continue

      const complete = buffer.slice(0, lastNL)
      buffer         = buffer.slice(lastNL + 1)
      const lines    = complete.split(/\r?\n/)

      if (!initialized) {
        delimiter   = detectDelimiter(complete)
        const first = lines.findIndex(l => l.trim() !== '')
        if (first === -1) continue
        headers     = splitLine(lines[first].trim(), delimiter)
        for (let i = first + 1; i < lines.length; i++) processLine(lines[i])
        initialized = true
      } else {
        for (const line of lines) processLine(line)
      }

      onProgress?.(Math.round((bytesRead / file.size) * 100))
    }

    if (buffer.trim() && initialized) processLine(buffer)
    onProgress?.(100)

    return { rowCount, errors }
  }
}
