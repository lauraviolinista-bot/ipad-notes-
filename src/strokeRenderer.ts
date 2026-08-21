import type { Stroke } from './types'
import { getPenPreset } from './penTypes'

function seededJitter(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function drawTextured(ctx: CanvasRenderingContext2D, stroke: Stroke, coarse: boolean) {
  const grains = coarse ? 5 : 3
  const spread = coarse ? 0.9 : 0.6
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const w = Math.max(1, stroke.width * ((a.pressure + b.pressure) / 2))
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
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const pressureFactor = pressureSensitive ? (a.pressure + b.pressure) / 2 : 1
    ctx.lineWidth = Math.max(1, stroke.width * pressureFactor)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function drawMarker(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.lineCap = 'square'
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    ctx.lineWidth = stroke.width
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function drawCalligraphy(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const nibAngle = -Math.PI / 4
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const strokeAngle = Math.atan2(b.y - a.y, b.x - a.x)
    const diff = Math.abs(Math.sin(strokeAngle - nibAngle))
    const pressureFactor = (a.pressure + b.pressure) / 2
    const w = Math.max(1, stroke.width * pressureFactor * (0.25 + diff * 0.9))
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

function drawWatercolor(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const layers = 4
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    const w = Math.max(2, stroke.width * ((a.pressure + b.pressure) / 2))
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

  switch (preset.render) {
    case 'textured':
      drawTextured(ctx, stroke, stroke.tool === 'charcoal')
      break
    case 'marker':
      drawMarker(ctx, stroke)
      break
    case 'calligraphy':
      drawCalligraphy(ctx, stroke)
      break
    case 'watercolor':
      drawWatercolor(ctx, stroke)
      break
    case 'smooth':
    default:
      drawSmooth(ctx, stroke, preset.pressureSensitive)
      break
  }

  ctx.globalAlpha = 1
}
