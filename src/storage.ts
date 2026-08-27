import type { Notebook, NotebookCover, Page, PageTemplate, TextStyle } from './types'
import { COVER_PRESETS } from './coverPresets'

const KEY = 'goodnotes-clone:notebooks'

export function loadNotebooks(): Notebook[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const notebooks = JSON.parse(raw) as Notebook[]
    return notebooks.map((nb) => ({
      ...nb,
      cover: nb.cover ?? COVER_PRESETS[0],
      folder: nb.folder ?? null,
      tags: nb.tags ?? [],
      favorite: nb.favorite ?? false,
      pages: nb.pages.map((p) => ({
        ...p,
        elements: (p.elements ?? []).map((el) =>
          el.type === 'text'
            ? {
                ...el,
                style: {
                  fontFamily: 'sans',
                  fontSize: 16,
                  bold: false,
                  italic: false,
                  align: 'left',
                  ...(el.style as Partial<TextStyle>),
                } as TextStyle,
              }
            : el,
        ),
        template: p.template ?? 'blank',
        background: p.background ?? null,
        ocrText: p.ocrText ?? '',
      })),
    }))
  } catch {
    return []
  }
}

// Returns true on success, false when the write failed (e.g. storage quota
// exceeded) — the caller surfaces this to the user instead of losing work silently.
export function saveNotebooks(notebooks: Notebook[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(notebooks))
    return true
  } catch {
    return false
  }
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function emptyPage(template: PageTemplate = 'blank', background: string | null = null): Page {
  return { id: newId(), strokes: [], elements: [], template, background, ocrText: '' }
}

export function emptyNotebook(name: string, cover: NotebookCover = COVER_PRESETS[0]): Notebook {
  return {
    id: newId(),
    name,
    pages: [emptyPage()],
    updatedAt: Date.now(),
    cover,
  }
}

const BACKUP_VERSION = 1

// Downloads all notebooks as a single JSON file — a manual backup/restore
// path until real multi-device sync (which needs a backend account) exists.
export function exportBackup(notebooks: Notebook[]) {
  const payload = { version: BACKUP_VERSION, exportedAt: Date.now(), notebooks }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `notas-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Parses a backup file and returns its notebooks with fresh ids, so importing
// the same backup twice (or into a notebook list that already has some of
// these notebooks) never collides with or overwrites existing data.
export async function importBackupFile(file: File): Promise<Notebook[]> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const notebooks: Notebook[] = Array.isArray(parsed) ? parsed : parsed.notebooks
  if (!Array.isArray(notebooks)) throw new Error('Archivo de copia de seguridad no válido')
  return notebooks.map((nb) => ({
    ...nb,
    id: newId(),
    pages: nb.pages.map((p) => ({ ...p, id: newId() })),
  }))
}
