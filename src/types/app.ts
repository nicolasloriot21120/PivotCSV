import type { ParseError, RawRow }  from '@/lib/loader'
import type { PivotConfig, PivotData } from '@/lib/pivot/types'
import type { ConfiguratorState }   from '@/components/PivotConfigurator/types'

export type FileEntry = {
  id:          string
  file:        File
  headers:     string[]
  preview:     RawRow[]
  parseErrors: ParseError[]
  rowCount:    number | null
  pivotCount:  number        // nb de sections associées à ce fichier
}

export type Section = {
  id:                string
  fileId:            string
  fileName:          string
  label:             string
  collapsed:         boolean
  configuratorOpen:  boolean
  configuratorState: ConfiguratorState
  result:            PivotData | null
  errors:            ParseError[]
  status:            'idle' | 'computing' | 'done' | 'error'
  progress:          number
  config:            PivotConfig | null
}
