import type { ValidationResult, LoadResult, StreamResult } from './csv/types'

/**
 * Contrat générique pour tout chargeur de fichier.
 * R = format brut issu du parsing (ex: CSVParseResult, JSON parsed, …)
 * T = type de sortie métier
 */
export abstract class GenericLoader<T, R = unknown> {
  abstract parse(file: File): Promise<R>
  abstract validate(raw: R): ValidationResult<T>
  abstract transform(raw: R): T[]
  abstract getTemplate(): string

  async load(file: File): Promise<LoadResult<T>> {
    const raw                    = await this.parse(file)
    const { valid, data, errors } = this.validate(raw)
    return { ok: valid, data, errors }
  }

  /**
   * Compte les lignes de données en scannant les bytes bruts (0x0A).
   * Très rapide — pas de parsing. Limitation : les champs contenant un \n
   * entre guillemets (ex : cellules Excel multi-lignes) seront surcomptés.
   */
  async countRows(file: File): Promise<number> {
    const reader = file.stream().getReader()
    let newlines = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const byte of value) {
        if (byte === 0x0A) newlines++
      }
    }
    return Math.max(0, newlines - 1)
  }

  /**
   * Traitement en streaming : émet chaque ligne au fur et à mesure sans
   * stocker l'ensemble des lignes en mémoire.
   * Implémentation par défaut = fallback batch — les sous-classes surchargent
   * pour un vrai streaming ligne à ligne.
   */
  async stream(
    file: File,
    onRow: (row: T) => void,
    onProgress?: (percent: number) => void,
  ): Promise<StreamResult> {
    const result = await this.load(file)
    result.data.forEach((row, i) => {
      onRow(row)
      if (onProgress && i % 1000 === 0)
        onProgress(Math.round((i / result.data.length) * 100))
    })
    onProgress?.(100)
    return { rowCount: result.data.length, errors: result.errors }
  }
}
