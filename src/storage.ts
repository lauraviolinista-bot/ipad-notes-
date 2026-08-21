import type { Notebook } from './types'

const KEY = 'goodnotes-clone:notebooks'

export function loadNotebooks(): Notebook[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as Notebook[]
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

export function emptyPage() {
  return { id: newId(), strokes: [] }
}

export function emptyNotebook(name: string): Notebook {
  return {
    id: newId(),
    name,
    pages: [emptyPage()],
    updatedAt: Date.now(),
  }
}
