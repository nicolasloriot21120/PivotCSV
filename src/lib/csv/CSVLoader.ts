import { GenericLoader }   from './GenericLoader'
import { parseCSV }        from './parse'
import type { CSVParseResult } from './types'

/**
 * Couche CSV : implémente parse() via parseCSV.
 * validate(), transform() et getTemplate() restent abstraits —
 * à implémenter dans chaque loader métier.
 */
export abstract class CSVLoader<T> extends GenericLoader<T, CSVParseResult> {
  async parse(file: File): Promise<CSVParseResult> {
    const text = await file.text()
    return parseCSV(text)
  }
}
