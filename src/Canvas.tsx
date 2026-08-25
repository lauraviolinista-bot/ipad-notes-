import { useEffect, useRef } from 'react'
import type { Page, PenType, ShapeKind, Stroke, StrokePoint } from './types'
import { getPenPreset } from './penTypes'
import { drawStroke } from './strokeRenderer'
import { computeShapePoints } from './shapes'
import { strokesBBox, pointInBBox } from './geometry'

type CanvasTool = PenType | 'eraser' | 'select' | 'shape' | null

interface CanvasProps {
  page: Page
  tool: CanvasTool
  color: string
  color2?: string | null
  width: number
  straight: boolean
  shapeKind: ShapeKind
  selectedStrokeIds: string[]
  onStrokeEnd: (stroke: Stroke) => void
  onErase: (strokeIds: string[]) => void
  onSelectStrokes: (ids: string[]) => void
  onMoveStrokes: (ids: string[], dx: number, dy: number) => void
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

function drawMarquee(ctx: CanvasRenderingContext2D, a: StrokePoint, b: StrokePoint) {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const w = Math.abs(a.x - b.x)
  const h = Math.abs(a.y - b.y)
  ctx.save()
  ctx.globalAlpha = 1
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = '#0a84ff'
  ctx.lineWidth = 1.5
  ctx.fillStyle = 'rgba(10,132,255,0.08)'
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

function drawSelectionOutline(ctx: CanvasRenderingContext2D, box: { minX: number; minY: number; maxX: number; maxY: number }) {
  ctx.save()
  ctx.globalAlpha = 1
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = '#0a84ff'
  ctx.lineWidth = 1.5
  ctx.strokeRect(box.minX - 6, box.minY - 6, box.maxX - box.minX + 12, box.maxY - box.minY + 12)
  ctx.restore()
}

export default function Canvas({
  page,
  tool,
  color,
  color2,
  width,
  straight,
  shapeKind,
  selectedStrokeIds,
  onStrokeEnd,
  onErase,
  onSelectStrokes,
  onMoveStrokes,
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
  // Smoothed pressure carried across move events — raw Apple Pencil pressure
  // has small sample-to-sample noise that otherwise reads as a shaky line width.
  const smoothedPressureRef = useRef(0.5)

  // Selection tool state
  const selectModeRef = useRef<'marquee' | 'move' | null>(null)
  const marqueeStartRef = useRef<StrokePoint | null>(null)
  const marqueeCurrentRef = useRef<StrokePoint | null>(null)
  const moveOriginRef = useRef<StrokePoint | null>(null)
  const moveDeltaRef = useRef({ dx: 0, dy: 0 })
  const movingIdsRef = useRef<string[]>([])

  const redrawBackground = () => {
    const canvas = bgRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    const hidden = movingIdsRef.current
    for (const stroke of page.strokes) {
      if (erasedRef.current.has(stroke.id)) continue
      if (selectModeRef.current === 'move' && hidden.includes(stroke.id)) continue
      drawStroke(ctx, stroke)
    }
  }

  const redrawOverlay = (previewStroke?: Stroke) => {
    const canvas = overlayRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    if (previewStroke) {
      drawStroke(ctx, previewStroke)
    } else if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current)
    }

    if (selectModeRef.current === 'marquee' && marqueeStartRef.current && marqueeCurrentRef.current) {
      drawMarquee(ctx, marqueeStartRef.current, marqueeCurrentRef.current)
    }

    if (selectModeRef.current === 'move' && movingIdsRef.current.length > 0) {
      const { dx, dy } = moveDeltaRef.current
      const moving = page.strokes.filter((s) => movingIdsRef.current.includes(s.id))
      for (const s of moving) {
        drawStroke(ctx, { ...s, points: s.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })) })
      }
      const box = strokesBBox(moving)
      if (box) {
        drawSelectionOutline(ctx, {
          minX: box.minX + dx,
          minY: box.minY + dy,
          maxX: box.maxX + dx,
          maxY: box.maxY + dy,
        })
      }
    } else if (selectedStrokeIds.length > 0) {
      const box = strokesBBox(page.strokes.filter((s) => selectedStrokeIds.includes(s.id)))
      if (box) drawSelectionOutline(ctx, box)
    }
  }

  useEffect(() => {
    erasedRef.current = new Set()
    redrawBackground()
    redrawOverlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedStrokeIds])

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

  // Exponential smoothing on pressure: keeps the line responsive to real
  // pressure changes (leaning harder for a thicker stroke) while filtering
  // out the small per-sample jitter Apple Pencil reports.
  const getSmoothedPoint = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): StrokePoint => {
    const point = getPoint(e)
    const smoothed = smoothedPressureRef.current * 0.55 + point.pressure * 0.45
    smoothedPressureRef.current = smoothed
    return { ...point, pressure: smoothed }
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

  const strokeHitAt = (point: StrokePoint): string | null => {
    const radius = 10
    for (let idx = page.strokes.length - 1; idx >= 0; idx--) {
      const stroke = page.strokes[idx]
      for (let i = 0; i < stroke.points.length; i++) {
        const p = stroke.points[i]
        const prev = stroke.points[i - 1]
        const hit = prev
          ? distToSegment(point, prev, p) < radius
          : Math.hypot(point.x - p.x, point.y - p.y) < radius
        if (hit) return stroke.id
      }
    }
    return null
  }

  const handleSelectPointerDown = (point: StrokePoint) => {
    if (selectedStrokeIds.length > 0) {
      const box = strokesBBox(page.strokes.filter((s) => selectedStrokeIds.includes(s.id)))
      if (box && pointInBBox(point.x, point.y, box, 10)) {
        selectModeRef.current = 'move'
        moveOriginRef.current = point
        moveDeltaRef.current = { dx: 0, dy: 0 }
        movingIdsRef.current = selectedStrokeIds
        return
      }
    }
    selectModeRef.current = 'marquee'
    marqueeStartRef.current = point
    marqueeCurrentRef.current = point
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

    if (tool === 'select') {
      handleSelectPointerDown(getPoint(e))
      return
    }

    const point = getPoint(e)
    startPointRef.current = point

    if (tool === 'shape') {
      const stroke: Stroke = {
        id: Math.random().toString(36).slice(2),
        tool: 'fineliner',
        color,
        width,
        opacity: 1,
        // Reused as an "exact geometry, skip smoothing" flag for shape strokes.
        straight: true,
        points: computeShapePoints(shapeKind, point, point),
      }
      currentStrokeRef.current = stroke
      return
    }

    smoothedPressureRef.current = point.pressure

    const preset = getPenPreset(tool)
    const stroke: Stroke = {
      id: Math.random().toString(36).slice(2),
      tool,
      color,
      color2: color2 ?? null,
      width,
      opacity: preset.opacity,
      straight: straight && preset.supportsStraightLine,
      points: [point],
    }
    currentStrokeRef.current = stroke
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

    if (tool === 'select') {
      const point = getPoint(e)
      if (selectModeRef.current === 'move' && moveOriginRef.current) {
        moveDeltaRef.current = {
          dx: point.x - moveOriginRef.current.x,
          dy: point.y - moveOriginRef.current.y,
        }
        redrawBackground()
      } else if (selectModeRef.current === 'marquee') {
        marqueeCurrentRef.current = point
      }
      redrawOverlay()
      return
    }

    const stroke = currentStrokeRef.current
    if (!stroke) return

    if (tool === 'shape' && startPointRef.current) {
      stroke.points = computeShapePoints(shapeKind, startPointRef.current, getPoint(e))
      redrawOverlay()
      return
    }
    if (stroke.straight && startPointRef.current) {
      stroke.points = [startPointRef.current, getPoint(e)]
      redrawOverlay()
      return
    }

    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    for (const ev of events) stroke.points.push(getSmoothedPoint(ev))

    // Predicted points shave perceived latency off fast handwriting — Apple
    // Pencil apps like Notability render a short predicted tail ahead of the
    // real samples so the ink feels attached to the tip. They're shown in the
    // overlay preview only and never committed to the saved stroke.
    const predicted = e.nativeEvent.getPredictedEvents?.() ?? []
    if (predicted.length > 0) {
      const predictedPoints = predicted.map((ev) => getPoint(ev))
      redrawOverlay({ ...stroke, points: [...stroke.points, ...predictedPoints] })
    } else {
      redrawOverlay()
    }
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

    if (tool === 'select') {
      if (selectModeRef.current === 'move' && moveOriginRef.current) {
        const { dx, dy } = moveDeltaRef.current
        const ids = movingIdsRef.current
        selectModeRef.current = null
        moveOriginRef.current = null
        movingIdsRef.current = []
        moveDeltaRef.current = { dx: 0, dy: 0 }
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          onMoveStrokes(ids, dx, dy)
        } else {
          redrawBackground()
          redrawOverlay()
        }
        return
      }

      if (selectModeRef.current === 'marquee' && marqueeStartRef.current && marqueeCurrentRef.current) {
        const a = marqueeStartRef.current
        const b = marqueeCurrentRef.current
        const tiny = Math.abs(a.x - b.x) < 6 && Math.abs(a.y - b.y) < 6
        selectModeRef.current = null
        marqueeStartRef.current = null
        marqueeCurrentRef.current = null

        if (tiny) {
          const hitId = strokeHitAt(a)
          onSelectStrokes(hitId ? [hitId] : [])
        } else {
          const minX = Math.min(a.x, b.x)
          const maxX = Math.max(a.x, b.x)
          const minY = Math.min(a.y, b.y)
          const maxY = Math.max(a.y, b.y)
          const ids = page.strokes
            .filter((s) => s.points.some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY))
            .map((s) => s.id)
          onSelectStrokes(ids)
        }
        redrawOverlay()
      }
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
