import { CSVLoader }        from '../loader/csv/CSVLoader'
import { PivotAccumulator } from './PivotAccumulator'
import type { PivotConfig } from './types'
import type { ParseError }  from '../loader/csv/types'

type WorkerRequest = {
  file:   File
  config: PivotConfig
}

const loader = new CSVLoader()

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { file, config } = e.data

  try {
    const accumulator = new PivotAccumulator(config)
    const { errors }  = await loader.stream(
      file,
      row  => accumulator.add(row),
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
