import type { PenType } from './types'

export type RenderStyle = 'smooth' | 'textured' | 'calligraphy' | 'watercolor' | 'marker'

export interface PenPreset {
  id: PenType
  label: string
  icon: string
  minWidth: number
  maxWidth: number
  defaultWidth: number
  opacity: number
  pressureSensitive: boolean
  render: RenderStyle
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
    render: 'textured',
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
    render: 'smooth',
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
    render: 'smooth',
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
    render: 'smooth',
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
    render: 'smooth',
    supportsStraightLine: true,
  },
  {
    id: 'marker',
    label: 'Rotulador',
    icon: '🖊️',
    minWidth: 6,
    maxWidth: 20,
    defaultWidth: 12,
    opacity: 0.65,
    pressureSensitive: false,
    render: 'marker',
    supportsStraightLine: true,
  },
  {
    id: 'calligraphy',
    label: 'Caligrafía',
    icon: '✒️',
    minWidth: 3,
    maxWidth: 16,
    defaultWidth: 8,
    opacity: 1,
    pressureSensitive: true,
    render: 'calligraphy',
    supportsStraightLine: false,
  },
  {
    id: 'watercolor',
    label: 'Acuarela',
    icon: '🎨',
    minWidth: 8,
    maxWidth: 40,
    defaultWidth: 20,
    opacity: 0.5,
    pressureSensitive: true,
    render: 'watercolor',
    supportsStraightLine: false,
  },
  {
    id: 'charcoal',
    label: 'Carboncillo',
    icon: '🪨',
    minWidth: 3,
    maxWidth: 18,
    defaultWidth: 8,
    opacity: 0.9,
    pressureSensitive: true,
    render: 'textured',
    supportsStraightLine: false,
  },
]

export function getPenPreset(id: PenType): PenPreset {
  return PEN_PRESETS.find((p) => p.id === id) ?? PEN_PRESETS[0]
}
