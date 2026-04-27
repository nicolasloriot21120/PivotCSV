import { GenericLoader }                              from '../GenericLoader'
import { parseCSV }                                   from './parse'
import type { CSVParseResult, RawRow, ValidationResult } from './types'

/**
 * Loader CSV concret — parse() via parseCSV, passthrough par défaut.
 * Étendre et surcharger validate() + transform() pour un schéma métier.
 */
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
}
