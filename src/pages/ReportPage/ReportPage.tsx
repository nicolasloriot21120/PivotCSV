import {
  DndContext, DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { AppSidebar }           from '@/components/AppSidebar'
import { LoadingOverlay }       from '@/components/ui/LoadingSpinner'
import { EmptyState, ReportHeader, SortablePivotSection, PresentationMode } from './components'
import { useReportPage }        from './useReportPage'
import styles                   from './styles.module.css'

export function ReportPage() {
  const {
    theme, setTheme, THEMES,
    sidebarOpen, setSidebarOpen,
    fileEntries, sections, draggingSection,
    canPresent, presentableSections,
    sensors,
    handleFiles, handleFileSelect, handleAddPivot, handleRemoveFile,
    updateSection, deleteSection, computeSection, cancelSection,
    presentationLoading, presentationOpen, openPresentation, closePresentation,
    onDragStart, onDragEnd,
  } = useReportPage()

  return (
    <>
    <div className={styles.page}>

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

      <div className={styles.mainArea}>

        <ReportHeader
          sectionsCount={sections.length}
          canPresent={canPresent}
          onOpenPresentation={openPresentation}
        />

        <main className={styles.mainScroll}>
          {sections.length === 0 ? (
            <EmptyState />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.sectionsList}>
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
                  <div className={styles.dragOverlayCard}>
                    <span className={styles.dragOverlayLabel}>{draggingSection.label}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </main>

      </div>
    </div>

    {presentationLoading && (
      <LoadingOverlay label="Génération de la présentation en cours…" />
    )}

    {presentationOpen && (
      <PresentationMode
        sections={presentableSections}
        onClose={closePresentation}
      />
    )}
    </>
  )
}
