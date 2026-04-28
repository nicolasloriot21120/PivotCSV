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

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { file, config } = e.data
  const filters = config.filters ?? []

  try {
    const accumulator = new PivotAccumulator(config)
    const { errors }  = await loader.stream(
      file,
      row  => { if (passesFilters(row, filters)) accumulator.add(row) },
      pct  => self.postMessage({ type: 'progress', percent: pct }),
    )

    self.postMessage({ type: 'result', data: accumulator.result(), errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    self.postMessage({ type: 'error', message })
  }
}

export type WorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'result';   data: ReturnType<InstanceType<typeof PivotAccumulator>['result']>; errors: ParseError[] }
  | { type: 'error';    message: string }
