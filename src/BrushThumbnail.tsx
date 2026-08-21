import { useEffect, useRef } from 'react'
import type { PenType, Stroke } from './types'
import { getPenPreset } from './penTypes'
import { drawStroke } from './strokeRenderer'

function sampleStroke(tool: PenType, color: string, width: number, w: number, h: number): Stroke {
  const points = []
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push({
      x: 6 + t * (w - 12),
      y: h / 2 + Math.sin(t * Math.PI * 2.2) * (h * 0.22),
      pressure: 0.35 + Math.sin(t * Math.PI) * 0.65,
    })
  }
  const preset = getPenPreset(tool)
  return {
    id: 'preview',
    tool,
    color,
    width: Math.min(width, preset.maxWidth),
    opacity: preset.opacity,
    straight: false,
    points,
  }
}

interface BrushThumbnailProps {
  tool: PenType
  color?: string
  width?: number
  height?: number
}

export default function BrushThumbnail({
  tool,
  color = '#1c1c1e',
  width = 96,
  height = 40,
}: BrushThumbnailProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const preset = getPenPreset(tool)
    const stroke = sampleStroke(tool, color, preset.defaultWidth, width, height)
    drawStroke(ctx, stroke)
  }, [tool, color, width, height])

  return <canvas ref={ref} className="brush-thumb" />
}
