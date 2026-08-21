import type { PenType } from './types'

export type RenderStyle = 'smooth' | 'textured' | 'calligraphy' | 'watercolor' | 'marker'
export type PenCategory = 'boceto' | 'tinta' | 'pintura' | 'destacado'

export interface PenPreset {
  id: PenType
  label: string
  description: string
  icon: string
  category: PenCategory
  minWidth: number
  maxWidth: number
  defaultWidth: number
  opacity: number
  pressureSensitive: boolean
  render: RenderStyle
  supportsStraightLine: boolean
}

export const PEN_CATEGORIES: { id: PenCategory; label: string }[] = [
  { id: 'boceto', label: 'Boceto' },
  { id: 'tinta', label: 'Tinta' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'destacado', label: 'Destacado' },
]

export const PEN_PRESETS: PenPreset[] = [
  {
    id: 'pencil',
    label: 'Lápiz HB',
    description: 'Grafito clásico con grano suave, sensible a la presión.',
    icon: '✏️',
    category: 'boceto',
    minWidth: 1,
    maxWidth: 6,
    defaultWidth: 2,
    opacity: 0.85,
    pressureSensitive: true,
    render: 'textured',
    supportsStraightLine: false,
  },
  {
    id: 'charcoal',
    label: 'Carboncillo',
    description: 'Grano grueso e irregular, ideal para sombreado suelto.',
    icon: '🪨',
    category: 'boceto',
    minWidth: 3,
    maxWidth: 18,
    defaultWidth: 8,
    opacity: 0.9,
    pressureSensitive: true,
    render: 'textured',
    supportsStraightLine: false,
  },
  {
    id: 'fineliner',
    label: 'Bolígrafo fino',
    description: 'Línea uniforme y precisa, sin variación de presión.',
    icon: '🖊️',
    category: 'tinta',
    minWidth: 1,
    maxWidth: 4,
    defaultWidth: 2,
    opacity: 1,
    pressureSensitive: false,
    render: 'smooth',
    supportsStraightLine: false,
  },
  {
    id: 'fountain',
    label: 'Pluma',
    description: 'Tinta fluida con trazo que responde a la presión.',
    icon: '🖋️',
    category: 'tinta',
    minWidth: 1,
    maxWidth: 10,
    defaultWidth: 3,
    opacity: 1,
    pressureSensitive: true,
    render: 'smooth',
    supportsStraightLine: false,
  },
  {
    id: 'calligraphy',
    label: 'Caligrafía',
    description: 'Plumín en ángulo: fino en vertical, grueso en diagonal.',
    icon: '✒️',
    category: 'tinta',
    minWidth: 3,
    maxWidth: 16,
    defaultWidth: 8,
    opacity: 1,
    pressureSensitive: true,
    render: 'calligraphy',
    supportsStraightLine: false,
  },
  {
    id: 'brush',
    label: 'Pincel artístico',
    description: 'Cerdas suaves con carga de presión, ideal para ilustración.',
    icon: '🖌️',
    category: 'pintura',
    minWidth: 2,
    maxWidth: 24,
    defaultWidth: 10,
    opacity: 0.9,
    pressureSensitive: true,
    render: 'smooth',
    supportsStraightLine: false,
  },
  {
    id: 'watercolor',
    label: 'Acuarela',
    description: 'Capas translúcidas superpuestas, efecto de tinta aguada.',
    icon: '🎨',
    category: 'pintura',
    minWidth: 8,
    maxWidth: 40,
    defaultWidth: 20,
    opacity: 0.5,
    pressureSensitive: true,
    render: 'watercolor',
    supportsStraightLine: false,
  },
  {
    id: 'marker',
    label: 'Rotulador',
    description: 'Trazo plano semi-opaco con puntas cuadradas.',
    icon: '🖊️',
    category: 'pintura',
    minWidth: 6,
    maxWidth: 20,
    defaultWidth: 12,
    opacity: 0.65,
    pressureSensitive: false,
    render: 'marker',
    supportsStraightLine: true,
  },
  {
    id: 'highlighter',
    label: 'Subrayador',
    description: 'Muy transparente, con modo de línea recta para subrayar.',
    icon: '🖍️',
    category: 'destacado',
    minWidth: 5,
    maxWidth: 30,
    defaultWidth: 16,
    opacity: 0.35,
    pressureSensitive: false,
    render: 'smooth',
    supportsStraightLine: true,
  },
]

export function getPenPreset(id: PenType): PenPreset {
  return PEN_PRESETS.find((p) => p.id === id) ?? PEN_PRESETS[0]
}
