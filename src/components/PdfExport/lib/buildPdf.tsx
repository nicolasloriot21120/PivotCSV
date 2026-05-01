import { pdf, Document, Page, View, Image, Text, StyleSheet } from '@react-pdf/renderer'
import { captureBlock } from './captureBlocks'
import type { LayoutRow, LayoutCell } from '../types'
import type { Section } from '@/types/app'
import { PDF_W, PDF_H } from '../types'

const styles = StyleSheet.create({
  page:    { backgroundColor: 'white' },
  row:     { flexDirection: 'row' },
  cell:    {},
  image:   { width: '100%', height: '100%' },
  comment: { padding: 10, fontSize: 10, color: '#1e293b' },
})

export async function buildAndDownloadPdf(rows: LayoutRow[], _sections: Section[], filename = 'export.pdf') {
  const totalRowFlex = rows.reduce((s, r) => s + r.flex, 0)

  // Capturer les vrais contenus depuis la page principale (data-export-target)
  const images: Record<string, string | null> = {}
  for (const row of rows) {
    for (const cell of row.cells) {
      const { content } = cell
      if (content.type === 'table' || content.type === 'chart') {
        const key = `${row.id}-${cell.id}`
        try {
          images[key] = await captureBlock(content.sectionId, content.type)
        } catch {
          images[key] = null
        }
      }
    }
  }

  const PdfDoc = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {rows.map((row: LayoutRow) => {
          const rowH = (row.flex / totalRowFlex) * PDF_H
          const totalCellFlex = row.cells.reduce((s: number, c: LayoutCell) => s + c.flex, 0)
          return (
            <View key={row.id} style={[styles.row, { height: rowH }]}>
              {row.cells.map((cell: LayoutCell) => {
                const cellW = (cell.flex / totalCellFlex) * PDF_W
                const imgKey = `${row.id}-${cell.id}`
                return (
                  <View key={cell.id} style={[styles.cell, { width: cellW, height: rowH, overflow: 'hidden' }]}>
                    {cell.content.type === 'comment' ? (
                      <Text style={styles.comment}>{cell.content.text}</Text>
                    ) : images[imgKey] ? (
                      <Image style={styles.image} src={images[imgKey]!} objectFit="contain" />
                    ) : null}
                  </View>
                )
              })}
            </View>
          )
        })}
      </Page>
    </Document>
  )

  const blob = await pdf(<PdfDoc />).toBlob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
