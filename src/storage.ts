import type { Notebook, NotebookCover, Page, PageTemplate } from './types'
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
      pages: nb.pages.map((p) => ({
        ...p,
        elements: p.elements ?? [],
        template: p.template ?? 'blank',
      })),
    }))
  } catch {
    return []
  }
}

export function saveNotebooks(notebooks: Notebook[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notebooks))
  } catch {
    // storage full or unavailable — ignore, in-memory state still works
  }
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function emptyPage(template: PageTemplate = 'blank'): Page {
  return { id: newId(), strokes: [], elements: [], template }
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
