import type { ValidationResult, LoadResult } from './types'

/**
 * Contrat générique pour tout chargeur de fichier.
 * R = format brut issu du parsing (ex: CSVParseResult, JSON parsed, …)
 * T = type de sortie métier
 */
export abstract class GenericLoader<T, R = unknown> {
  /** Lit le fichier et retourne sa forme brute. */
  abstract parse(file: File): Promise<R>

  /** Vérifie la cohérence métier du résultat brut. */
  abstract validate(raw: R): ValidationResult<T>

  /** Convertit le résultat brut en objets typés. */
  abstract transform(raw: R): T[]

  /** Retourne un exemple de fichier valide (contenu texte). */
  abstract getTemplate(): string

  /** Orchestre parse → validate → transform. Point d'entrée principal. */
  async load(file: File): Promise<LoadResult<T>> {
    const raw                    = await this.parse(file)
    const { valid, data, errors } = this.validate(raw)
    return { ok: valid, data, errors }
  }
}
