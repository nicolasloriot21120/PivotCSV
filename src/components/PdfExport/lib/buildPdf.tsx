import { pdf, Document, Page, View, Image, Text, StyleSheet } from '@react-pdf/renderer'
import type { ExportBlock } from '../types'

const styles = StyleSheet.create({
  page:    { backgroundColor: 'white', position: 'relative' },
  block:   { position: 'absolute' },
  image:   { width: '100%', height: '100%', objectFit: 'contain' },
  comment: { fontSize: 10, color: '#334155', padding: 8, border: '1pt solid #e2e8f0', borderRadius: 4 },
  title:   { fontSize: 8, color: '#64748b', marginBottom: 4, fontWeight: 'bold' },
})

function PdfDocument({ blocks, images }: { blocks: ExportBlock[]; images: Record<string, string> }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map(block => (
          <View key={block.id} style={[styles.block, { left: block.x, top: block.y, width: block.width, height: block.height }]}>
            {block.type === 'comment' ? (
              <View style={styles.comment}>
                {block.label && <Text style={styles.title}>{block.label}</Text>}
                <Text style={{ fontSize: 10, color: '#1e293b' }}>{block.comment ?? ''}</Text>
              </View>
            ) : (
              images[block.id] ? <Image style={styles.image} src={images[block.id]} /> : null
            )}
          </View>
        ))}
      </Page>
    </Document>
  )
}

export async function buildAndDownloadPdf(blocks: ExportBlock[], images: Record<string, string>, filename = 'export.pdf') {
  const blob = await pdf(<PdfDocument blocks={blocks} images={images} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
