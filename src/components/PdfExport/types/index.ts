export type ExportBlockType = 'table' | 'chart' | 'comment'

export type ExportBlock = {
  id:         string
  type:       ExportBlockType
  sectionId?: string
  label:      string
  x:          number        // position sur la page A4 (en pt)
  y:          number
  width:      number
  height:     number
  comment?:   string        // pour type === 'comment'
}

export const PDF_W = 595
export const PDF_H = 842
export const CANVAS_SCALE = 0.75
