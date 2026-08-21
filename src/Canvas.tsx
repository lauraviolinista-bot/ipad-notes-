import { useEffect, useRef } from 'react'
import type { Page, PenType, Stroke, StrokePoint } from './types'
import { getPenPreset } from './penTypes'
import { drawStroke } from './strokeRenderer'

interface CanvasProps {
  page: Page
  tool: PenType | 'eraser' | null
  color: string
  width: number
  straight: boolean
  onStrokeEnd: (stroke: Stroke) => void
  onErase: (strokeIds: string[]) => void
  onPointerDownCapture?: () => void
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

export default function Canvas({
  page,
  tool,
  color,
  width,
  straight,
  onStrokeEnd,
  onErase,
  onPointerDownCapture,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)
  const startPointRef = useRef<StrokePoint | null>(null)
  const erasedRef = useRef<Set<string>>(new Set())

  const redraw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
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
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
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
    if (tool === null) return
    if (e.pointerType === 'touch' && e.isPrimary === false) return
    onPointerDownCapture?.()
    canvasRef.current?.setPointerCapture(e.pointerId)
    drawingRef.current = true

    if (tool === 'eraser') {
      erasedRef.current = new Set()
      eraseAt(getPoint(e))
      return
    }

    const point = getPoint(e)
    startPointRef.current = point
    const preset = getPenPreset(tool)
    const stroke: Stroke = {
      id: Math.random().toString(36).slice(2),
      tool,
      color,
      width,
      opacity: preset.opacity,
      straight: straight && preset.supportsStraightLine,
      points: [point],
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
    const dpr = window.devicePixelRatio || 1
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
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
    const point = getPoint(e)

    if (stroke.straight && startPointRef.current) {
      stroke.points = [startPointRef.current, point]
    } else {
      stroke.points.push(point)
    }
    redraw()
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
    startPointRef.current = null
    if (stroke && stroke.points.length > 0) {
      onStrokeEnd(stroke)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="paper-canvas"
      style={{ pointerEvents: tool === null ? 'none' : 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  )
}
