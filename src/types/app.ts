import type { ParseError, RawRow }  from '@/lib/loader'
import type { PivotConfig, PivotData } from '@/lib/pivot/types'
import type { ConfiguratorState }   from '@/components/PivotConfigurator/types'
import type { ChartType }           from '@/components/ui/PivotChart'
import type { ValueScale }          from '@/lib/pivot/format'

export type FileEntry = {
  id:             string
  file:           File
  headers:        string[]
  preview:        RawRow[]
  parseErrors:    ParseError[]
  rowCount:       number | null
  pivotCount:     number        // nb de sections associées à ce fichier
  distinctValues: Record<string, string[]>  // toutes valeurs distinctes par colonne string
}

export type Section = {
  id:                string
  fileId:            string
  fileName:          string
  label:             string
  collapsed:         boolean
  configuratorOpen:  boolean
  configuratorState: ConfiguratorState
  result:             PivotData | null
  errors:             ParseError[]
  errorMessage:       string | null
  status:             'idle' | 'computing' | 'done' | 'error'
  progress:           number
  config:             PivotConfig | null
  collapsedRowGroups: string[]
  collapsedColGroups: string[]
  chartType:          ChartType             // type de graphique actif
  chartLayout:        'horizontal' | 'vertical'  // tableau et graphique côte-à-côte ou empilés
  tableFlex:          number                // flex-grow du tableau
  chartFlex:          number                // flex-grow du graphique
  valueScale:         ValueScale            // échelle d'affichage des valeurs
  valueDecimals:      number                // nombre de décimales affichées
  chartColors:        Record<string, string> // couleurs personnalisées par label de série
  chartTranspose:     boolean               // intervertir lignes/colonnes dans le graphique
}
