import { CSVLoader }        from '../loader/csv/CSVLoader'
import { PivotAccumulator } from './PivotAccumulator'
import type { PivotConfig, PivotFilter } from './types'
import type { ParseError, RawRow }       from '../loader/csv/types'

type WorkerRequest = {
  file:   File
  config: PivotConfig
}

const loader = new CSVLoader()

function passesFilters(row: RawRow, filters: PivotFilter[]): boolean {
  for (const f of filters) {
    const raw = row[f.field]
    if (f.type === 'categorical') {
      if (!f.values.includes(String(raw ?? ''))) return false
    } else {
      const n = Number(raw)
      if (isNaN(n)) return false
      if (f.min !== undefined && n < f.min) return false
      if (f.max !== undefined && n > f.max) return false
    }
  }
  return true
}

const MAX_CELLS = 50_000

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { file, config } = e.data
  const filters = config.filters ?? []

  try {
    const accumulator = new PivotAccumulator(config)
    let lastPct = -1

    const { errors } = await loader.stream(
      file,
      row => { if (passesFilters(row, filters)) accumulator.add(row) },
      pct => {
        if (pct !== lastPct) {
          lastPct = pct
          self.postMessage({ type: 'progress', percent: pct })
        }
      },
    )

    const result    = accumulator.result()
    const cellCount = result.rowKeys.length * result.colKeys.length

    if (cellCount > MAX_CELLS) {
      self.postMessage({
        type:    'error',
        message: `Le tableau généré contient ${cellCount.toLocaleString('fr-FR')} cellules (${result.rowKeys.length} lignes × ${result.colKeys.length} colonnes). Limite : ${MAX_CELLS.toLocaleString('fr-FR')}. Réduisez le nombre de valeurs uniques ou ajoutez des filtres.`,
      })
      return
    }

    self.postMessage({ type: 'result', data: result, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    self.postMessage({ type: 'error', message })
  }
}

export type WorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'result';   data: ReturnType<InstanceType<typeof PivotAccumulator>['result']>; errors: ParseError[] }
  | { type: 'error';    message: string }
