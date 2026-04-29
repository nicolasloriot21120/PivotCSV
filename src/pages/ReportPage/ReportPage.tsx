import {
  DndContext, DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS }           from '@dnd-kit/utilities'
import { LayoutGrid }    from 'lucide-react'

import { AppSidebar }    from '@/components/AppSidebar'
import { PivotSection }  from '@/components/PivotSection'
import { ThemePicker }   from '@/components/ui/ThemePicker'
import type { RawRow }             from '@/lib/loader'
import type { PivotConfig }        from '@/lib/pivot/types'
import type { Section }            from '@/types/app'
import type { ConfiguratorState }  from '@/components/PivotConfigurator/types'

import { useReportPage } from './ReportPage.functions'

// ── Sortable wrapper ──────────────────────────────────────────────────────────

type SortableProps = {
  section:   Section
  headers:   string[]
  preview:   RawRow[]
  onUpdate:  (patch: Partial<Section>) => void
  onCompute: (config: PivotConfig) => void
  onCancel:  () => void
  onDelete:  () => void
}

function SortablePivotSection({ section, headers, preview, onUpdate, onCompute, onCancel, onDelete }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <PivotSection
        section={section}
        headers={headers}
        preview={preview}
        dragHandleAttrs={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
        onLabelChange={label => onUpdate({ label })}
        onToggleCollapse={() => onUpdate({ collapsed: !section.collapsed })}
        onConfigChange={(s: ConfiguratorState) => onUpdate({ configuratorState: s })}
        onCompute={onCompute}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ReportPage() {
  const {
    theme, setTheme, THEMES,
    sidebarOpen, setSidebarOpen,
    fileEntries, sections, draggingSection,
    sensors,
    handleFiles, handleFileSelect, handleAddPivot, handleRemoveFile,
    updateSection, deleteSection, computeSection, cancelSection,
    onDragStart, onDragEnd,
  } = useReportPage()

  return (
    <div className="flex h-screen overflow-hidden bg-base">

      <AppSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        fileEntries={fileEntries}
        onFiles={handleFiles}
        onFileSelect={handleFileSelect}
        onAddPivot={handleAddPivot}
        onRemoveFile={handleRemoveFile}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="flex items-center justify-between px-6 h-12 border-b border-border bg-surface flex-shrink-0">
          <div className="flex items-center gap-2 text-muted">
            <LayoutGrid size={14} />
            <span className="text-xs font-medium">
              {sections.length === 0
                ? 'Aucune section — ajoutez un pivot depuis la sidebar'
                : `${sections.length} section${sections.length > 1 ? 's' : ''}`
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemePicker themes={THEMES} value={theme} onChange={setTheme} />
            <img src="/finex-icon-dark.svg" alt="Finex" className="h-7 w-auto opacity-50 hover:opacity-80 transition-opacity" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <LayoutGrid size={32} className="text-subtle" />
              <p className="text-muted text-sm font-medium">Aucune section</p>
              <p className="text-subtle text-xs max-w-xs">
                Importez un fichier CSV dans la sidebar puis cliquez sur&nbsp;
                <span className="text-accent">+</span> pour créer votre premier pivot.
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4">
                  {sections.map(section => {
                    const entry = fileEntries.find(f => f.id === section.fileId)
                    return (
                      <SortablePivotSection
                        key={section.id}
                        section={section}
                        headers={entry?.headers ?? []}
                        preview={entry?.preview ?? []}
                        onUpdate={patch => updateSection(section.id, patch)}
                        onCompute={config => computeSection(section.id, config)}
                        onCancel={() => cancelSection(section.id)}
                        onDelete={() => deleteSection(section.id)}
                      />
                    )
                  })}
                </div>
              </SortableContext>

              <DragOverlay>
                {draggingSection && (
                  <div className="rounded-[var(--radius-lg)] border border-accent/40 bg-surface shadow-[var(--shadow-elevated)] px-4 py-3 opacity-90">
                    <span className="text-sm font-semibold text-text">{draggingSection.label}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </main>

      </div>
    </div>
  )
}
