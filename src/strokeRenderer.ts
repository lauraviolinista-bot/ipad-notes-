import type { Stroke, StrokePoint } from './types'
import { getPenPreset } from './penTypes'

function seededJitter(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function mixColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

// Returns a function that maps a 0..1 position along the stroke to a color —
// either the flat stroke color, or an interpolation toward color2 for duo-color strokes.
function colorRamp(stroke: Stroke): (t: number) => string {
  if (!stroke.color2) return () => stroke.color
  return (t: number) => mixColor(stroke.color, stroke.color2!, t)
}

// Catmull-Rom spline interpolation: turns the raw, slightly jittery pointer
// samples into a smooth curve, closer to how the Apple Pencil ink looks in
// GoodNotes/Notes rather than a jagged polyline of raw touch points.
function smoothPoints(points: StrokePoint[], subdivisions = 4): StrokePoint[] {
  if (points.length < 3) return points
  const result: StrokePoint[] = [points[0]]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    for (let t = 1; t <= subdivisions; t++) {
      const s = t / subdivisions
      const s2 = s * s
      const s3 = s2 * s
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * s +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3)
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * s +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3)
      const pressure = p1.pressure + (p2.pressure - p1.pressure) * s
      result.push({ x, y, pressure })
    }
  }
  return result
}

function drawTextured(ctx: CanvasRenderingContext2D, stroke: Stroke, coarse: boolean) {
  const grains = coarse ? 5 : 3
  const spread = coarse ? 0.9 : 0.6
  const ramp = colorRamp(stroke)
  const last = stroke.points.length - 1
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const w = Math.max(1, stroke.width * ((a.pressure + b.pressure) / 2))
    ctx.strokeStyle = ramp(i / last)
    for (let g = 0; g < grains; g++) {
      const jitter = (seededJitter(i * 7.3 + g) - 0.5) * w * spread
      ctx.lineWidth = Math.max(0.5, w * (coarse ? 0.55 : 0.4))
      ctx.globalAlpha = stroke.opacity * (0.4 + seededJitter(i + g * 3.1) * 0.5)
      ctx.beginPath()
      ctx.moveTo(a.x + jitter, a.y + jitter)
      ctx.lineTo(b.x + jitter, b.y + jitter)
      ctx.stroke()
    }
  }
}

function drawSmooth(ctx: CanvasRenderingContext2D, stroke: Stroke, pressureSensitive: boolean) {
  const ramp = colorRamp(stroke)
  const last = stroke.points.length - 1
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const pressureFactor = pressureSensitive ? (a.pressure + b.pressure) / 2 : 1
    ctx.lineWidth = Math.max(1, stroke.width * pressureFactor)
    ctx.strokeStyle = ramp(i / last)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function drawMarker(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.lineCap = 'square'
  const ramp = colorRamp(stroke)
  const last = stroke.points.length - 1
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    ctx.lineWidth = stroke.width
    ctx.strokeStyle = ramp(i / last)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function drawCalligraphy(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const nibAngle = -Math.PI / 4
  const ramp = colorRamp(stroke)
  const last = stroke.points.length - 1
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const strokeAngle = Math.atan2(b.y - a.y, b.x - a.x)
    const diff = Math.abs(Math.sin(strokeAngle - nibAngle))
    const pressureFactor = (a.pressure + b.pressure) / 2
    const w = Math.max(1, stroke.width * pressureFactor * (0.25 + diff * 0.9))
    ctx.lineWidth = w
    ctx.strokeStyle = ramp(i / last)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function drawWatercolor(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const layers = 4
  const ramp = colorRamp(stroke)
  const last = stroke.points.length - 1
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const w = Math.max(2, stroke.width * ((a.pressure + b.pressure) / 2))
    ctx.strokeStyle = ramp(i / last)
    for (let l = 0; l < layers; l++) {
      const jitter = (seededJitter(i * 3.7 + l * 5.1) - 0.5) * w * 0.5
      ctx.lineWidth = w * (1 - l * 0.18)
      ctx.globalAlpha = stroke.opacity * 0.35
      ctx.beginPath()
      ctx.moveTo(a.x + jitter, a.y + jitter)
      ctx.lineTo(b.x + jitter, b.y + jitter)
      ctx.stroke()
    }
  }
}

interface Stamp {
  x: number
  y: number
  angle: number
  pressure: number
}

function walkStamps(stroke: Stroke, spacing: number): Stamp[] {
  const stamps: Stamp[] = []
  let carry = 0
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const segLen = Math.hypot(dx, dy)
    if (segLen === 0) continue
    const angle = Math.atan2(dy, dx)
    let dist = spacing - carry
    while (dist < segLen) {
      const t = dist / segLen
      stamps.push({
        x: a.x + dx * t,
        y: a.y + dy * t,
        angle,
        pressure: a.pressure + (b.pressure - a.pressure) * t,
      })
      dist += spacing
    }
    carry = segLen - (dist - spacing)
  }
  return stamps
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  kind: 'crosshatch' | 'stipple' | 'grid' | 'brick',
) {
  const w = stroke.width
  const spacing = kind === 'stipple' ? w * 0.4 : w * 0.7
  const stamps = walkStamps(stroke, spacing)
  const ramp = colorRamp(stroke)
  const lastStamp = Math.max(1, stamps.length - 1)
  ctx.lineCap = 'butt'

  stamps.forEach((s, i) => {
    const localW = Math.max(4, w * (0.6 + s.pressure * 0.6))
    const perpX = -Math.sin(s.angle)
    const perpY = Math.cos(s.angle)
    const stampColor = ramp(i / lastStamp)
    ctx.strokeStyle = stampColor

    if (kind === 'crosshatch') {
      const off = (seededJitter(i * 5.4) - 0.5) * localW
      const cx = s.x + perpX * off
      const cy = s.y + perpY * off
      const r = localW * 0.35
      ctx.globalAlpha = stroke.opacity * (0.6 + seededJitter(i * 2.1) * 0.4)
      ctx.lineWidth = Math.max(0.6, w * 0.06)
      for (const dir of [1, -1]) {
        const a1 = s.angle + (Math.PI / 4) * dir
        ctx.beginPath()
        ctx.moveTo(cx - Math.cos(a1) * r, cy - Math.sin(a1) * r)
        ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r)
        ctx.stroke()
      }
    } else if (kind === 'stipple') {
      const dots = 2 + Math.floor(seededJitter(i * 1.7) * 3)
      for (let d = 0; d < dots; d++) {
        const off = (seededJitter(i * 3.3 + d * 9.1) - 0.5) * localW
        const along = (seededJitter(i * 8.8 + d * 2.3) - 0.5) * spacing
        const cx = s.x + perpX * off + Math.cos(s.angle) * along
        const cy = s.y + perpY * off + Math.sin(s.angle) * along
        ctx.globalAlpha = stroke.opacity * (0.5 + seededJitter(i + d) * 0.5)
        ctx.beginPath()
        ctx.arc(cx, cy, Math.max(0.6, w * 0.06), 0, Math.PI * 2)
        ctx.fillStyle = stampColor
        ctx.fill()
      }
    } else if (kind === 'grid') {
      const lanes = [-0.35, 0, 0.35]
      const tangentX = Math.cos(s.angle)
      const tangentY = Math.sin(s.angle)
      const r = spacing * 0.42
      ctx.lineWidth = Math.max(0.6, w * 0.05)
      ctx.globalAlpha = stroke.opacity * 0.75
      for (const lane of lanes) {
        const off = lane * localW
        const cx = s.x + perpX * off
        const cy = s.y + perpY * off
        ctx.beginPath()
        ctx.moveTo(cx - tangentX * r, cy - tangentY * r)
        ctx.lineTo(cx + tangentX * r, cy + tangentY * r)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - perpX * localW * 0.3, cy - perpY * localW * 0.3)
        ctx.lineTo(cx + perpX * localW * 0.3, cy + perpY * localW * 0.3)
        ctx.stroke()
      }
    } else if (kind === 'brick') {
      const parity = i % 2 === 0 ? -0.25 : 0.25
      const off = parity * localW
      const cx = s.x + perpX * off
      const cy = s.y + perpY * off
      const bw = spacing * 0.9
      const bh = localW * 0.4
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(s.angle)
      ctx.globalAlpha = stroke.opacity * 0.85
      ctx.fillStyle = stampColor
      ctx.fillRect(-bw / 2, -bh / 2, bw * 0.85, bh)
      ctx.restore()
    }
  })
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const preset = getPenPreset(stroke.tool)
  if (stroke.points.length < 2) {
    if (stroke.points.length === 1) {
      const p = stroke.points[0]
      ctx.beginPath()
      ctx.fillStyle = stroke.color
      ctx.globalAlpha = stroke.opacity
      ctx.arc(p.x, p.y, (stroke.width * p.pressure) / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    return
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = stroke.color
  ctx.globalAlpha = stroke.opacity

  const needsSmoothing =
    !stroke.straight &&
    (preset.render === 'smooth' || preset.render === 'calligraphy' || preset.render === 'marker')
  const renderStroke = needsSmoothing
    ? { ...stroke, points: smoothPoints(stroke.points) }
    : stroke

  switch (preset.render) {
    case 'textured':
      drawTextured(ctx, renderStroke, stroke.tool === 'charcoal')
      break
    case 'marker':
      drawMarker(ctx, renderStroke)
      break
    case 'calligraphy':
      drawCalligraphy(ctx, renderStroke)
      break
    case 'watercolor':
      drawWatercolor(ctx, renderStroke)
      break
    case 'pattern':
      drawPattern(ctx, renderStroke, preset.pattern ?? 'crosshatch')
      break
    case 'smooth':
    default:
      drawSmooth(ctx, renderStroke, preset.pressureSensitive)
      break
  }

  ctx.globalAlpha = 1
}
