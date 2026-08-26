import type { StrokePoint } from './types'
import { computeShapePoints } from './shapes'

type ShapeGuess = 'line' | 'rectangle' | 'ellipse' | null

// A light heuristic shape-recognizer, in the spirit of PencilKit's "draw
// and hold" shape assist: after a stroke ends, decide whether it looks
// enough like a straight line, a rectangle, or a circle/ellipse to snap it
// into a clean geometric version instead of leaving the wobbly freehand path.
function guessShape(points: StrokePoint[]): ShapeGuess {
  if (points.length < 6) return null

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const w = maxX - minX
  const h = maxY - minY
  const diag = Math.hypot(w, h)
  if (diag < 24) return null

  const first = points[0]
  const last = points[points.length - 1]
  const closedDist = Math.hypot(last.x - first.x, last.y - first.y)
  const closed = closedDist < diag * 0.2

  if (!closed) {
    // Least-squares line fit: ratio of the minor to major spread eigenvalue
    // is near 0 when the points are nearly collinear.
    const n = points.length
    const mx = xs.reduce((a, b) => a + b, 0) / n
    const my = ys.reduce((a, b) => a + b, 0) / n
    let sxx = 0
    let sxy = 0
    let syy = 0
    for (const p of points) {
      const dx = p.x - mx
      const dy = p.y - my
      sxx += dx * dx
      sxy += dx * dy
      syy += dy * dy
    }
    const mid = (sxx + syy) / 2
    const disc = Math.sqrt(Math.max(0, ((sxx - syy) / 2) ** 2 + sxy * sxy))
    const lambda1 = mid + disc
    const lambda2 = mid - disc
    const linearity = lambda2 / (lambda1 || 1)
    if (linearity < 0.035) return 'line'
    return null
  }

  // Closed shape: shoelace area vs bounding-box area, plus a rough corner count.
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    area += a.x * b.y - b.x * a.y
  }
  area = Math.abs(area) / 2
  const bboxArea = w * h
  const fill = bboxArea > 0 ? area / bboxArea : 0

  let corners = 0
  const step = Math.max(1, Math.floor(points.length / 40))
  let prevAngle: number | null = null
  for (let i = step; i < points.length; i += step) {
    const a = points[i - step]
    const b = points[i]
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    if (prevAngle !== null) {
      let diff = Math.abs(angle - prevAngle)
      if (diff > Math.PI) diff = 2 * Math.PI - diff
      if (diff > 0.9) corners++
    }
    prevAngle = angle
  }

  if (fill > 0.68 && corners <= 6) return 'rectangle'
  if (corners <= 2) return 'ellipse'
  return null
}

// Runs shape recognition on a finished stroke's points and, if it matches,
// returns the snapped replacement points — otherwise returns the originals.
export function applyShapeAssist(points: StrokePoint[]): StrokePoint[] {
  const guess = guessShape(points)
  if (!guess) return points

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  if (guess === 'line') {
    return computeShapePoints('line', points[0], points[points.length - 1])
  }
  return computeShapePoints(guess, { x: minX, y: minY }, { x: maxX, y: maxY })
}
