import type { NotebookCover } from './types'

export const COVER_PRESETS: NotebookCover[] = [
  { background: '#f4f1ea', accent: '#c9a86a', pattern: 'bottom-bar' },
  { background: '#e8d9c5', accent: '#8a5a3b', pattern: 'plain' },
  { background: '#d9e6f2', accent: '#3a6ea5', pattern: 'stripe' },
  { background: '#e3d9f0', accent: '#7b4ea3', pattern: 'bottom-bar' },
  { background: '#dcefe0', accent: '#3f9457', pattern: 'plain' },
  { background: '#fbe0e0', accent: '#c9524f', pattern: 'stripe' },
  { background: '#1c1c1e', accent: '#f5f5f7', pattern: 'plain' },
  { background: '#fff4d6', accent: '#e0a11a', pattern: 'bottom-bar' },
]

export function randomCover(): NotebookCover {
  return COVER_PRESETS[Math.floor(Math.random() * COVER_PRESETS.length)]
}
