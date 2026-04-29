import type { FileEntry, Section } from '@/types/app'

const STATE_KEY   = 'pivotcsv-state'
const fileKey     = (id: string) => `pivotcsv-file-${id}`

type StoredEntry = Omit<FileEntry, 'file'> & { fileName: string }
type StoredState = {
  entries:     StoredEntry[]
  sections:    Omit<Section, 'result' | 'status' | 'progress'>[]
  sidebarOpen: boolean
}

export async function saveState(
  fileEntries: FileEntry[],
  sections:    Section[],
  sidebarOpen: boolean,
): Promise<void> {
  try {
    for (const entry of fileEntries) {
      if (!localStorage.getItem(fileKey(entry.id))) {
        localStorage.setItem(fileKey(entry.id), await entry.file.text())
      }
    }

    // Purge stored content for removed files
    const activeIds = new Set(fileEntries.map(e => e.id))
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('pivotcsv-file-') && !activeIds.has(key.slice('pivotcsv-file-'.length))) {
        localStorage.removeItem(key)
      }
    }

    const state: StoredState = {
      entries:  fileEntries.map(({ file, ...rest }) => ({ ...rest, fileName: file.name })),
      sections: sections.map(({ result: _r, status: _s, progress: _p, ...rest }) => rest),
      sidebarOpen,
    }
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded — ignore
  }
}

export function loadState(): {
  fileEntries: FileEntry[]
  sections:    Section[]
  sidebarOpen: boolean
} | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return null
    const { entries, sections, sidebarOpen }: StoredState = JSON.parse(raw)

    const fileEntries: FileEntry[] = entries.map(({ fileName, ...rest }) => ({
      ...rest,
      file: new File(
        [localStorage.getItem(fileKey(rest.id)) ?? ''],
        fileName,
        { type: 'text/csv' },
      ),
    }))

    const restoredSections: Section[] = sections.map(s => ({
      ...s,
      result:   null,
      status:   'idle' as const,
      progress: 0,
    }))

    return { fileEntries, sections: restoredSections, sidebarOpen }
  } catch {
    return null
  }
}
