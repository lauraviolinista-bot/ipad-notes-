import { useEffect, useRef } from 'react'
import type { Page, Stroke, StrokePoint, Tool } from './types'

interface CanvasProps {
  page: Page
  tool: Tool
  color: string
  width: number
  onStrokeEnd: (stroke: Stroke) => void
  onErase: (strokeIds: string[]) => void
}

const TOOL_OPACITY: Record<Tool, number> = {
  pen: 1,
  highlighter: 0.35,
  eraser: 1,
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
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
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1]
    const b = stroke.points[i]
    ctx.lineWidth = Math.max(1, stroke.width * ((a.pressure + b.pressure) / 2))
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function distToSegment(p: StrokePoint, a: StrokePoint, b: StrokePoint) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const projX = a.x + t * dx
  const projY = a.y + t * dy
  return Math.hypot(p.x - projX, p.y - projY)
}

export default function Canvas({ page, tool, color, width, onStrokeEnd, onErase }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)
  const erasedRef = useRef<Set<string>>(new Set())

  const redraw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of page.strokes) {
      drawStroke(ctx, stroke)
    }
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current)
    }
  }

  useEffect(() => {
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const parent = canvas?.parentElement
      if (!canvas || !parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      ctx?.scale(dpr, dpr)
      redraw()
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && e.isPrimary === false) return
    canvasRef.current?.setPointerCapture(e.pointerId)
    drawingRef.current = true

    if (tool === 'eraser') {
      erasedRef.current = new Set()
      eraseAt(getPoint(e))
      return
    }

    const stroke: Stroke = {
      id: Math.random().toString(36).slice(2),
      tool,
      color,
      width,
      opacity: TOOL_OPACITY[tool],
      points: [getPoint(e)],
    }
    currentStrokeRef.current = stroke
  }

  const eraseAt = (point: StrokePoint) => {
    const radius = 14
    for (const stroke of page.strokes) {
      if (erasedRef.current.has(stroke.id)) continue
      for (let i = 0; i < stroke.points.length; i++) {
        const p = stroke.points[i]
        const prev = stroke.points[i - 1]
        const hit = prev
          ? distToSegment(point, prev, p) < radius
          : Math.hypot(point.x - p.x, point.y - p.y) < radius
        if (hit) {
          erasedRef.current.add(stroke.id)
          break
        }
      }
    }
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const stroke of page.strokes) {
        if (!erasedRef.current.has(stroke.id)) drawStroke(ctx, stroke)
      }
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return

    if (tool === 'eraser') {
      eraseAt(getPoint(e))
      return
    }

    const stroke = currentStrokeRef.current
    if (!stroke) return
    stroke.points.push(getPoint(e))
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) redraw()
  }

  const handlePointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false

    if (tool === 'eraser') {
      if (erasedRef.current.size > 0) {
        onErase(Array.from(erasedRef.current))
      }
      erasedRef.current = new Set()
      return
    }

    const stroke = currentStrokeRef.current
    currentStrokeRef.current = null
    if (stroke && stroke.points.length > 0) {
      onStrokeEnd(stroke)
    }
  }

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        className="paper"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  )
}
