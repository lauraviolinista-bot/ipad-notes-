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

function resizeCanvasToParent(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement
  if (!parent) return
  const rect = parent.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const w = Math.max(1, Math.round(rect.width))
  const h = Math.max(1, Math.round(rect.height))
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
  }
  const ctx = canvas.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
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
  // Background canvas holds committed strokes — redrawn only when they change.
  const bgRef = useRef<HTMLCanvasElement>(null)
  // Overlay canvas holds only the in-progress stroke — cheap to redraw every move.
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)
  const startPointRef = useRef<StrokePoint | null>(null)
  const erasedRef = useRef<Set<string>>(new Set())
  const activePointerIdRef = useRef<number | null>(null)
  // Timestamp of the last Apple Pencil ("pen") contact — used to reject palm
  // touches: a resting palm reads as pointerType "touch" and would otherwise
  // draw stray marks while writing.
  const lastPenActivityRef = useRef(0)
  const PALM_REJECTION_WINDOW_MS = 750

  const redrawBackground = () => {
    const canvas = bgRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    for (const stroke of page.strokes) {
      if (!erasedRef.current.has(stroke.id)) drawStroke(ctx, stroke)
    }
  }

  const redrawOverlay = () => {
    const canvas = overlayRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current)
    }
  }

  useEffect(() => {
    erasedRef.current = new Set()
    redrawBackground()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    const handleResize = () => {
      if (bgRef.current) resizeCanvasToParent(bgRef.current)
      if (overlayRef.current) resizeCanvasToParent(overlayRef.current)
      redrawBackground()
      redrawOverlay()
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): StrokePoint => {
    const canvas = overlayRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === null) return
    if (drawingRef.current) return // ignore extra fingers/palm while already drawing
    if (e.pointerType === 'touch' && e.isPrimary === false) return

    if (e.pointerType === 'pen') {
      lastPenActivityRef.current = Date.now()
    } else if (e.pointerType === 'touch') {
      const sincePen = Date.now() - lastPenActivityRef.current
      if (sincePen < PALM_REJECTION_WINDOW_MS) return // likely a resting palm
    }

    onPointerDownCapture?.()
    overlayRef.current?.setPointerCapture(e.pointerId)
    activePointerIdRef.current = e.pointerId
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
    let changed = false
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
          changed = true
          break
        }
      }
    }
    if (changed) redrawBackground()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    if (e.pointerId !== activePointerIdRef.current) return
    if (e.pointerType === 'pen') lastPenActivityRef.current = Date.now()

    if (tool === 'eraser') {
      const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
      for (const ev of events) eraseAt(getPoint(ev))
      return
    }

    const stroke = currentStrokeRef.current
    if (!stroke) return

    if (stroke.straight && startPointRef.current) {
      stroke.points = [startPointRef.current, getPoint(e)]
    } else {
      const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
      for (const ev of events) stroke.points.push(getPoint(ev))
    }
    redrawOverlay()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    if (e.pointerId !== activePointerIdRef.current) return
    drawingRef.current = false
    activePointerIdRef.current = null

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
    redrawOverlay()
    if (stroke && stroke.points.length > 0) {
      onStrokeEnd(stroke)
    }
  }

  return (
    <>
      <canvas ref={bgRef} className="paper-canvas paper-canvas-bg" />
      <canvas
        ref={overlayRef}
        className="paper-canvas paper-canvas-overlay"
        style={{ pointerEvents: tool === null ? 'none' : 'auto' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </>
  )
}
