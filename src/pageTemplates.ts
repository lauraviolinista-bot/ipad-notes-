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
  { id: 'stars', label: 'Estrellitas', icon: '✨' },
  { id: 'hearts', label: 'Corazones', icon: '💕' },
]

const LINE_COLOR = 'rgba(60,60,70,0.16)'
const DOT_COLOR = 'rgba(60,60,70,0.28)'

// Draws a small heart centered in a larger transparent tile, so the tile
// size itself controls the spacing between hearts when repeated.
function heartTile(fill: string, tile: number, heart: number): string {
  const o = (tile - heart) / 2
  const scale = heart / 24
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}"><path transform="translate(${o} ${o}) scale(${scale})" d="M12 21s-7.5-4.6-10-9.3C.5 8.5 2 4 6 4c2 0 3.5 1.2 4 2.5C10.5 5.2 12 4 14 4c4 0 5.5 4.5 4 7.7C19.5 16.4 12 21 12 21z" fill="${fill}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

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
    case 'stars':
      return {
        backgroundImage: `
          radial-gradient(circle, rgba(255,143,184,0.22) 1.6px, transparent 1.8px),
          radial-gradient(circle, rgba(108,200,232,0.22) 1.6px, transparent 1.8px),
          radial-gradient(circle, rgba(185,138,240,0.22) 1.6px, transparent 1.8px)`,
        backgroundSize: '64px 64px, 80px 80px, 96px 96px',
        backgroundPosition: '0 0, 24px 40px, 48px 12px',
      }
    case 'hearts':
      return {
        backgroundImage: `
          ${heartTile('rgba(255,143,184,0.32)', 72, 13)},
          ${heartTile('rgba(185,138,240,0.26)', 64, 10)},
          ${heartTile('rgba(255,179,122,0.26)', 84, 11)}`,
        backgroundSize: '72px 72px, 64px 64px, 84px 84px',
        backgroundPosition: '0 0, 30px 38px, 54px 10px',
        backgroundRepeat: 'repeat',
      }
    case 'blank':
    default:
      return {}
  }
}
