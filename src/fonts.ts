import type { FontFamily } from './types'

export const FONT_STACKS: Record<FontFamily, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"SF Mono", "Courier New", monospace',
  handwritten: '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive',
}

export const FONT_PRESETS: { id: FontFamily; label: string }[] = [
  { id: 'sans', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'mono', label: 'Mono' },
  { id: 'handwritten', label: 'Manuscrita' },
]
