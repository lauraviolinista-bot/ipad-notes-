import type { CSSProperties } from 'react'
import type { PageTemplate } from './types'

export interface TemplatePreset {
  id: PageTemplate
  label: string
  icon: string
}

export const PAGE_TEMPLATES: TemplatePreset[] = [
  { id: 'blank', label: 'Blanco', icon: '▢' },
  { id: 'lined', label: 'Rayado', icon: '☰' },
  { id: 'grid', label: 'Cuadrícula', icon: '▦' },
  { id: 'dotted', label: 'Punteado', icon: '⠿' },
  { id: 'music', label: 'Partitura', icon: '♪' },
  { id: 'planner', label: 'Planificador', icon: '🗓️' },
]

const LINE_COLOR = 'rgba(60,60,70,0.16)'
const DOT_COLOR = 'rgba(60,60,70,0.28)'

export function templateBackgroundStyle(template: PageTemplate): CSSProperties {
  switch (template) {
    case 'lined':
      return {
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, ${LINE_COLOR} 31px 32px)`,
        backgroundPosition: '0 12px',
      }
    case 'grid':
      return {
        backgroundImage: `
          repeating-linear-gradient(to bottom, transparent 0 23px, ${LINE_COLOR} 23px 24px),
          repeating-linear-gradient(to right, transparent 0 23px, ${LINE_COLOR} 23px 24px)`,
      }
    case 'dotted':
      return {
        backgroundImage: `radial-gradient(${DOT_COLOR} 1.2px, transparent 1.2px)`,
        backgroundSize: '24px 24px',
      }
    case 'music':
      return {
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 60px,
          ${LINE_COLOR} 60px 61px,
          ${LINE_COLOR} 61px 62px,
          transparent 62px 78px,
          ${LINE_COLOR} 78px 79px,
          transparent 79px 95px,
          ${LINE_COLOR} 95px 96px,
          transparent 96px 112px,
          ${LINE_COLOR} 112px 113px,
          transparent 113px 129px,
          ${LINE_COLOR} 129px 130px,
          transparent 130px 160px
        )`,
        backgroundPosition: '0 24px',
      }
    case 'planner':
      return {
        backgroundImage: `
          linear-gradient(to right, ${LINE_COLOR} 0 2px, transparent 2px),
          repeating-linear-gradient(to bottom, transparent 0 39px, ${LINE_COLOR} 39px 40px)`,
        backgroundPosition: '90px 60px, 0 60px',
      }
    case 'blank':
    default:
      return {}
  }
}
