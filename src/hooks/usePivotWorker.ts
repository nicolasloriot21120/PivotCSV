import { useState, useRef, useCallback } from 'react'
import type { PivotConfig, PivotData }   from '@/lib/pivot'
import type { ParseError }               from '@/lib/loader'
import type { WorkerResponse }           from '@/lib/pivot/worker'

type Status = 'idle' | 'computing' | 'done' | 'error'

export function usePivotWorker() {
  const [status,   setStatus]   = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [result,   setResult]   = useState<PivotData | null>(null)
  const [errors,   setErrors]   = useState<ParseError[]>([])
  const workerRef = useRef<Worker | null>(null)

  const compute = useCallback((file: File, config: PivotConfig) => {
    workerRef.current?.terminate()

    const worker = new Worker(
      new URL('../lib/pivot/worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    setStatus('computing')
    setProgress(0)
    setResult(null)
    setErrors([])

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data
      if (msg.type === 'progress') {
        setProgress(msg.percent)
      } else if (msg.type === 'result') {
        setResult(msg.data)
        setErrors(msg.errors)
        setStatus('done')
        worker.terminate()
      } else if (msg.type === 'error') {
        setStatus('error')
        worker.terminate()
      }
    }

    worker.onerror = () => { setStatus('error'); worker.terminate() }
    worker.postMessage({ file, config })
  }, [])

  const cancel = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    setStatus('idle')
    setProgress(0)
  }, [])

  return { compute, cancel, status, progress, result, errors }
}
