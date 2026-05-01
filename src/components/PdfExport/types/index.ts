export type CellContent =
  | { type: 'empty' }
  | { type: 'table';   sectionId: string; label: string }
  | { type: 'chart';   sectionId: string; label: string }
  | { type: 'comment'; text: string }

export type LayoutCell = {
  id:      string
  content: CellContent
  flex:    number   // taille relative horizontale dans la ligne (min 1)
}

export type LayoutRow = {
  id:    string
  cells: LayoutCell[]
  flex:  number     // taille relative verticale dans la page (min 1)
}

// Dimensions A4 en points PDF
export const PDF_W = 595
export const PDF_H = 842

// Ratio d'affichage dans l'UI — la page fait CANVAS_W px de large
export const CANVAS_W = 620
export const CANVAS_H = Math.round(CANVAS_W * (297 / 210))  // ≈ 877
