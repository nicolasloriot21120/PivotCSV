import { useState } from 'react'
import {
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Section } from '@/types/app'

type Args = {
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
}

export function useSectionsDnD({ setSections }: Args) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }))

  const onDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id))

  const onDragEnd = (e: DragEndEvent) => {
    setDraggingId(null)
    if (!e.over || e.active.id === e.over.id) return
    setSections(ss => {
      const from = ss.findIndex(s => s.id === e.active.id)
      const to   = ss.findIndex(s => s.id === e.over!.id)
      return arrayMove(ss, from, to)
    })
  }

  return { sensors, draggingId, onDragStart, onDragEnd }
}
