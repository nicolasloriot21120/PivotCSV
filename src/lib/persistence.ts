import type { FileEntry, Section } from '@/types/app'

// ── IndexedDB — contenu des fichiers (pas de limite de taille) ────────────────

const DB_NAME = 'pivotcsv'
const STORE   = 'files'

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  })
}

async function idbPut(id: string, buf: ArrayBuffer): Promise<void> {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(buf, id).onsuccess = () => res()
    tx.onerror = () => rej(tx.error)
  })
}

async function idbGet(id: string): Promise<ArrayBuffer | null> {
  const db = await openDB()
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    req.onsuccess = () => res(req.result ?? null)
    req.onerror   = () => rej(req.error)
  })
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id).onsuccess = () => res()
    tx.onerror = () => rej(tx.error)
  })
}

async function idbKeys(): Promise<string[]> {
  const db = await openDB()
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys()
    req.onsuccess = () => res(req.result as string[])
    req.onerror   = () => rej(req.error)
  })
}

// ── localStorage — métadonnées légères uniquement ─────────────────────────────

const STATE_KEY = 'pivotcsv-state'

type StoredEntry = Omit<FileEntry, 'file' | 'distinctValues'> & { fileName: string }
type StoredState = {
  entries:     StoredEntry[]
  sections:    Omit<Section, 'result' | 'status' | 'progress'>[]
  sidebarOpen: boolean
}

// ── API publique ──────────────────────────────────────────────────────────────

export async function saveState(
  fileEntries: FileEntry[],
  sections:    Section[],
  sidebarOpen: boolean,
): Promise<void> {
  try {
    const activeIds  = new Set(fileEntries.map(e => e.id))
    const storedKeys = new Set(await idbKeys())

    // Écrire uniquement les nouveaux fichiers
    for (const entry of fileEntries) {
      if (!storedKeys.has(entry.id)) {
        await idbPut(entry.id, await entry.file.arrayBuffer())
      }
    }

    // Supprimer les fichiers retirés
    for (const key of storedKeys) {
      if (!activeIds.has(key)) await idbDelete(key)
    }

    const state: StoredState = {
      entries:  fileEntries.map(({ file, distinctValues: _dv, ...rest }) => ({ ...rest, fileName: file.name })),
      sections: sections.map(({ result: _r, status: _s, progress: _p, ...rest }) => rest),
      sidebarOpen,
    }
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // Ignore les erreurs de stockage
  }
}

export async function loadState(): Promise<{
  fileEntries: FileEntry[]
  sections:    Section[]
  sidebarOpen: boolean
} | null> {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return null
    const { entries, sections, sidebarOpen }: StoredState = JSON.parse(raw)

    const fileEntries: FileEntry[] = await Promise.all(
      entries.map(async ({ fileName, ...rest }) => {
        const buf = await idbGet(rest.id)
        return {
          ...rest,
          distinctValues: {},  // rescané en arrière-plan après restauration
          file: new File([buf ?? new ArrayBuffer(0)], fileName, { type: 'text/csv' }),
        }
      })
    )

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
