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
  { id: 'todo', label: 'Lista de tareas', icon: '☑️' },
  { id: 'cornell', label: 'Notas Cornell', icon: '📝' },
  { id: 'calendar', label: 'Calendario mensual', icon: '📆' },
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
    case 'todo':
      return {
        backgroundImage: `
          linear-gradient(to right, transparent 0 34px, ${LINE_COLOR} 34px 36px, transparent 36px),
          radial-gradient(${DOT_COLOR} 1px, transparent 1.4px)`,
        backgroundSize: '100% 100%, 480px 32px',
        backgroundPosition: '0 0, 18px 14px',
      }
    case 'cornell':
      return {
        backgroundImage: `
          linear-gradient(to bottom, transparent 0 78%, ${LINE_COLOR} 78% calc(78% + 2px), transparent calc(78% + 2px) 100%),
          linear-gradient(to right, transparent 0 28%, ${LINE_COLOR} 28% calc(28% + 2px), transparent calc(28% + 2px) 100%),
          repeating-linear-gradient(to bottom, transparent 0 27px, ${LINE_COLOR} 27px 28px)`,
        backgroundSize: '100% 100%, 100% 78%, 100% 78%',
        backgroundPosition: '0 0, 0 0, 0 12px',
        backgroundRepeat: 'no-repeat, no-repeat, repeat-y',
      }
    case 'calendar':
      return {
        backgroundImage: `
          repeating-linear-gradient(to right, transparent 0 calc(14.28% - 1px), ${LINE_COLOR} calc(14.28% - 1px) 14.28%),
          repeating-linear-gradient(to bottom, transparent 0 calc(20% - 1px), ${LINE_COLOR} calc(20% - 1px) 20%)`,
        backgroundPosition: '0 40px, 0 40px',
        backgroundSize: '100% calc(100% - 40px), 100% calc(100% - 40px)',
        backgroundRepeat: 'no-repeat',
      }
    case 'blank':
    default:
      return {}
  }
}
