import { useState } from 'react'
import type { Section } from '@/types/app'
import type { ExportBlock } from '../types'
import { captureBlock } from '../lib/captureBlocks'
import { buildAndDownloadPdf } from '../lib/buildPdf'

export function usePdfExport(sections: Section[]) {
  const [blocks, setBlocks] = useState<ExportBlock[]>([])
  const [generating, setGenerating] = useState(false)

  const toggleBlock = (sectionId: string, type: 'table' | 'chart') => {
    const id = `${sectionId}-${type}`
    setBlocks(prev => {
      if (prev.find(b => b.id === id)) return prev.filter(b => b.id !== id)
      const section = sections.find(s => s.id === sectionId)!
      const idx = prev.length
      return [...prev, {
        id, type, sectionId,
        label: `${section.label} — ${type === 'table' ? 'Tableau' : 'Graphique'}`,
        x: 20, y: 20 + idx * 220,
        width: 555, height: 200,
      }]
    })
  }

  const addComment = () => {
    const id = `comment-${crypto.randomUUID()}`
    setBlocks(prev => [...prev, {
      id, type: 'comment',
      label: 'Commentaire',
      x: 20, y: 20 + prev.length * 220,
      width: 555, height: 80,
      comment: '',
    }])
  }

  const updateBlock = (id: string, patch: Partial<ExportBlock>) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))

  const removeBlock = (id: string) =>
    setBlocks(prev => prev.filter(b => b.id !== id))

  const isSelected = (sectionId: string, type: 'table' | 'chart') =>
    blocks.some(b => b.id === `${sectionId}-${type}`)

  const generate = async () => {
    setGenerating(true)
    try {
      const images: Record<string, string> = {}
      for (const block of blocks) {
        if (block.type !== 'comment' && block.sectionId) {
          images[block.id] = await captureBlock(block.sectionId, block.type as 'table' | 'chart')
        }
      }
      await buildAndDownloadPdf(blocks, images)
    } finally {
      setGenerating(false)
    }
  }

  return { blocks, generating, toggleBlock, addComment, updateBlock, removeBlock, isSelected, generate }
}
