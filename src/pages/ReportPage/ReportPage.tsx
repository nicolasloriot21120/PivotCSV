import {
  DndContext, DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { LayoutGrid } from 'lucide-react'

import { AppSidebar }         from '@/components/AppSidebar'
import { SortablePivotSection } from './components/SortablePivotSection'
import { useReportPage }      from './useReportPage'

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
        themes={THEMES}
        theme={theme}
        onThemeChange={setTheme}
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
          <img src="/finex-wordmark-dark.svg" alt="Finex" className="h-9 w-auto opacity-50 hover:opacity-80 transition-opacity" />
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
                        distinctValues={entry?.distinctValues ?? {}}
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
