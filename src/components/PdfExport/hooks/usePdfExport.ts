import { useState } from 'react'
import type { Section } from '@/types/app'
import type { LayoutRow, LayoutCell, CellContent } from '../types'

function makeCell(flex = 10): LayoutCell {
  return { id: crypto.randomUUID(), content: { type: 'empty' }, flex }
}

function makeRow(flex = 10): LayoutRow {
  return { id: crypto.randomUUID(), cells: [makeCell()], flex }
}

export function usePdfExport(sections: Section[]) {
  const [rows, setRows] = useState<LayoutRow[]>([makeRow()])
  const [generating, setGenerating] = useState(false)

  // ── Lignes ────────────────────────────────────────────────────────────────

  const addRow = () => setRows(r => [...r, makeRow()])

  const removeRow = (rowId: string) =>
    setRows(r => r.length > 1 ? r.filter(row => row.id !== rowId) : r)

  const updateRowFlex = (rowId: string, flex: number) =>
    setRows(r => r.map(row => row.id === rowId ? { ...row, flex: Math.max(1, flex) } : row))

  // ── Cellules ──────────────────────────────────────────────────────────────

  const splitCell = (rowId: string, cellId: string) =>
    setRows(r => r.map(row => {
      if (row.id !== rowId) return row
      const idx = row.cells.findIndex(c => c.id === cellId)
      if (idx === -1) return row
      const half = Math.max(1, Math.round(row.cells[idx].flex / 2))
      const newCells = [...row.cells]
      newCells[idx] = { ...newCells[idx], flex: half }
      newCells.splice(idx + 1, 0, makeCell(half))
      return { ...row, cells: newCells }
    }))

  const removeCell = (rowId: string, cellId: string) =>
    setRows(r => r.map(row => {
      if (row.id !== rowId || row.cells.length <= 1) return row
      return { ...row, cells: row.cells.filter(c => c.id !== cellId) }
    }))

  const setCellContent = (rowId: string, cellId: string, content: CellContent) =>
    setRows(r => r.map(row => {
      if (row.id !== rowId) return row
      return { ...row, cells: row.cells.map(c => c.id === cellId ? { ...c, content } : c) }
    }))

  const updateCellFlex = (rowId: string, cellId: string, flex: number) =>
    setRows(r => r.map(row => {
      if (row.id !== rowId) return row
      return { ...row, cells: row.cells.map(c => c.id === cellId ? { ...c, flex: Math.max(1, flex) } : c) }
    }))

  // ── Génération ────────────────────────────────────────────────────────────

  const hasContent = rows.some(row => row.cells.some(c => c.content.type !== 'empty'))

  const generate = async () => {
    setGenerating(true)
    try {
      const { buildAndDownloadPdf } = await import('../lib/buildPdf')
      await buildAndDownloadPdf(rows, sections)
    } finally {
      setGenerating(false)
    }
  }

  return {
    rows, generating, hasContent,
    addRow, removeRow, updateRowFlex,
    splitCell, removeCell, setCellContent, updateCellFlex,
    sections,
  }
}
