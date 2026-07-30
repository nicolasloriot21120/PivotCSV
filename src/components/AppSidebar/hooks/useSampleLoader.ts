import { useCallback, useState } from 'react'

const SAMPLE_URL  = '/test-100k.csv'
const SAMPLE_NAME = 'test-100k.csv'

type Args = {
  onFiles:      (files: File[]) => void
  onFileSelect: (file: File) => void
}

export function useSampleLoader({ onFiles, onFileSelect }: Args) {
  const [loading, setLoading] = useState(false)

  const loadSample = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(SAMPLE_URL)
      const blob = await res.blob()
      const file = new File([blob], SAMPLE_NAME, { type: 'text/csv' })
      onFiles([file])
      onFileSelect(file)
    } finally {
      setLoading(false)
    }
  }, [onFiles, onFileSelect])

  return { loading, loadSample }
}
