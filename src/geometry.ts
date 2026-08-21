import type { Stroke } from './types'

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function strokesBBox(strokes: Stroke[]): BBox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const stroke of strokes) {
    for (const p of stroke.points) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
  }
  if (minX === Infinity) return null
  return { minX, minY, maxX, maxY }
}

export function pointInBBox(x: number, y: number, box: BBox, margin = 0): boolean {
  return (
    x >= box.minX - margin && x <= box.maxX + margin && y >= box.minY - margin && y <= box.maxY + margin
  )
}
