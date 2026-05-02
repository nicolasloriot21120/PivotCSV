import {
  DndContext, DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { LayoutGrid, Presentation } from 'lucide-react'

import { AppSidebar }           from '@/components/AppSidebar'
import { LoadingOverlay }       from '@/components/ui/LoadingSpinner'
import { SortablePivotSection } from './components/SortablePivotSection'
import { useReportPage }        from './useReportPage'
import { PresentationMode }     from './components/PresentationMode'
import styles                   from './styles.module.css'

export function ReportPage() {
  const {
    theme, setTheme, THEMES,
    sidebarOpen, setSidebarOpen,
    fileEntries, sections, draggingSection,
    sensors,
    handleFiles, handleFileSelect, handleAddPivot, handleRemoveFile,
    updateSection, deleteSection, computeSection, cancelSection,
    presentationLoading, presentationOpen, openPresentation, closePresentation,
    onDragStart, onDragEnd,
  } = useReportPage()

  const canPresent          = sections.some(s => s.config !== null)
  const presentableSections = sections.filter(s => s.result !== null)

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

        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <LayoutGrid size={14} />
            <span className={styles.sectionsCount}>
              {sections.length === 0
                ? 'Aucune section — ajoutez un pivot depuis la sidebar'
                : `${sections.length} section${sections.length > 1 ? 's' : ''}`
              }
            </span>
          </div>
          <div className={styles.headerActions}>
            {canPresent && (
              <button
                onClick={openPresentation}
                className={styles.actionButton}
                title="Mode présentation"
              >
                <Presentation size={13} />
                Présentation
              </button>
            )}
            <img src="/finex-wordmark-dark.svg" alt="Finex" className={styles.logo} />
          </div>
        </header>

        <main className={styles.mainScroll}>
          {sections.length === 0 ? (
            <div className={styles.emptyState}>
              <LayoutGrid size={32} className={styles.emptyStateIcon} />
              <p className={styles.emptyStateTitle}>Aucune section</p>
              <p className={styles.emptyStateDescription}>
                Importez un fichier CSV dans la sidebar puis cliquez sur&nbsp;
                <span className={styles.emptyStateHighlight}>+</span> pour créer votre premier pivot.
              </p>
            </div>
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
