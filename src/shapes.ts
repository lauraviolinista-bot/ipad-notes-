import type { ShapeKind, StrokePoint } from './types'

export interface ShapePreset {
  id: ShapeKind
  label: string
  icon: string
}

export const SHAPE_PRESETS: ShapePreset[] = [
  { id: 'line', label: 'Línea / regla', icon: '📏' },
  { id: 'rectangle', label: 'Rectángulo', icon: '▭' },
  { id: 'ellipse', label: 'Círculo / elipse', icon: '⬭' },
  { id: 'triangle', label: 'Triángulo', icon: '△' },
]

export const SHAPE_WIDTH_RANGE = { min: 1, max: 16, default: 3 }

const SNAP_ANGLE_STEP = Math.PI / 12 // 15°
const SNAP_TOLERANCE = 0.09 // ~5° tolerance

function snapAngle(angle: number): number {
  const nearest = Math.round(angle / SNAP_ANGLE_STEP) * SNAP_ANGLE_STEP
  return Math.abs(angle - nearest) < SNAP_TOLERANCE ? nearest : angle
}

export function computeShapePoints(
  kind: ShapeKind,
  start: { x: number; y: number },
  end: { x: number; y: number },
): StrokePoint[] {
  const p = (x: number, y: number): StrokePoint => ({ x, y, pressure: 1 })

  if (kind === 'line') {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const len = Math.hypot(dx, dy)
    if (len < 0.5) return [p(start.x, start.y)]
    const angle = snapAngle(Math.atan2(dy, dx))
    return [p(start.x, start.y), p(start.x + Math.cos(angle) * len, start.y + Math.sin(angle) * len)]
  }

  let w = end.x - start.x
  let h = end.y - start.y
  // Snap to a perfect square/circle when the drag is close to 1:1.
  const aw = Math.abs(w)
  const ah = Math.abs(h)
  if (Math.min(aw, ah) > 4 && Math.abs(aw - ah) < Math.max(aw, ah) * 0.12) {
    const s = Math.min(aw, ah)
    w = (w < 0 ? -1 : 1) * s
    h = (h < 0 ? -1 : 1) * s
  }
  const x2 = start.x + w
  const y2 = start.y + h
  const minX = Math.min(start.x, x2)
  const maxX = Math.max(start.x, x2)
  const minY = Math.min(start.y, y2)
  const maxY = Math.max(start.y, y2)

  if (kind === 'rectangle') {
    return [p(minX, minY), p(maxX, minY), p(maxX, maxY), p(minX, maxY), p(minX, minY)]
  }

  if (kind === 'ellipse') {
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const rx = Math.max(1, (maxX - minX) / 2)
    const ry = Math.max(1, (maxY - minY) / 2)
    const pts: StrokePoint[] = []
    const steps = 56
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2
      pts.push(p(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry))
    }
    return pts
  }

  // triangle
  const apex = p((minX + maxX) / 2, minY)
  const right = p(maxX, maxY)
  const left = p(minX, maxY)
  return [apex, right, left, apex]
}
