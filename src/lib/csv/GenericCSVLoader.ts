import { CSVLoader }  from './CSVLoader'
import type { CSVParseResult, RawRow, ValidationResult } from './types'

/**
 * Loader passthrough : aucun schéma imposé, retourne les lignes telles quelles.
 * Utilisé quand l'app doit accepter n'importe quel CSV sans transformation.
 */
export class GenericCSVLoader extends CSVLoader<RawRow> {
  validate(raw: CSVParseResult): ValidationResult<RawRow> {
    return {
      valid:  raw.errors.filter(e => e.severity === 'error').length === 0,
      data:   raw.rows,
      errors: raw.errors,
    }
  }

  transform(raw: CSVParseResult): RawRow[] {
    return raw.rows
  }

  getTemplate(): string {
    return 'colonne1,colonne2,colonne3\nvaleur1,valeur2,valeur3\n'
  }
}
