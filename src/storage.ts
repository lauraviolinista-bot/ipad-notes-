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
