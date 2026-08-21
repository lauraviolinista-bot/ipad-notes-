import type { PenType } from './types'

export interface PenPreset {
  id: PenType
  label: string
  icon: string
  minWidth: number
  maxWidth: number
  defaultWidth: number
  opacity: number
  pressureSensitive: boolean
  textured: boolean
  supportsStraightLine: boolean
}

export const PEN_PRESETS: PenPreset[] = [
  {
    id: 'pencil',
    label: 'Lápiz HB',
    icon: '✏️',
    minWidth: 1,
    maxWidth: 6,
    defaultWidth: 2,
    opacity: 0.85,
    pressureSensitive: true,
    textured: true,
    supportsStraightLine: false,
  },
  {
    id: 'fountain',
    label: 'Pluma',
    icon: '🖋️',
    minWidth: 1,
    maxWidth: 10,
    defaultWidth: 3,
    opacity: 1,
    pressureSensitive: true,
    textured: false,
    supportsStraightLine: false,
  },
  {
    id: 'brush',
    label: 'Pincel artístico',
    icon: '🖌️',
    minWidth: 2,
    maxWidth: 24,
    defaultWidth: 10,
    opacity: 0.9,
    pressureSensitive: true,
    textured: false,
    supportsStraightLine: false,
  },
  {
    id: 'fineliner',
    label: 'Bolígrafo fino',
    icon: '🖊️',
    minWidth: 1,
    maxWidth: 4,
    defaultWidth: 2,
    opacity: 1,
    pressureSensitive: false,
    textured: false,
    supportsStraightLine: false,
  },
  {
    id: 'highlighter',
    label: 'Subrayador',
    icon: '🖍️',
    minWidth: 5,
    maxWidth: 30,
    defaultWidth: 16,
    opacity: 0.35,
    pressureSensitive: false,
    textured: false,
    supportsStraightLine: true,
  },
]

export function getPenPreset(id: PenType): PenPreset {
  return PEN_PRESETS.find((p) => p.id === id) ?? PEN_PRESETS[0]
}
