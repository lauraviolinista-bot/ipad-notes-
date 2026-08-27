import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { LineCap, LineDash, Page, PenType, ShapeKind, Stroke, StrokePoint } from './types'
import { getPenPreset } from './penTypes'
import { drawStroke } from './strokeRenderer'
import { computeShapePoints } from './shapes'
import { strokesBBox, pointInBBox } from './geometry'
import { applyShapeAssist } from './shapeRecognition'

type CanvasTool = PenType | 'eraser' | 'select' | 'shape' | null

export interface CanvasHandle {
  // Aborts the stroke currently being drawn without committing it — used when
  // a second finger lands mid-touch and the gesture turns out to be a pinch,
  // so the accidental stub the first finger started never gets saved.
  cancelStroke: () => void
}

interface CanvasProps {
  page: Page
  tool: CanvasTool
  color: string
  color2?: string | null
  width: number
  straight: boolean
  lineDash?: LineDash
  lineCap?: LineCap
  pressureFactor?: number
  shapeAssist?: boolean
  // When set (radians), pen strokes are forced straight along this angle —
  // like resting the pencil against a ruler edge — regardless of drag direction.
  rulerAngle?: number | null
  shapeKind: ShapeKind
  selectedStrokeIds: string[]
  onStrokeEnd: (stroke: Stroke) => void
  onErase: (strokeIds: string[]) => void
  onSelectStrokes: (ids: string[]) => void
  onMoveStrokes: (ids: string[], dx: number, dy: number) => void
  onPointerDownCapture?: () => void
  // Untransformed ancestor used to size the canvas pixel buffer — the canvas's
  // direct parent gets pinch-zoomed visually, so it can't be used for that.
  sizeRef?: React.RefObject<HTMLElement | null>
  // Live pinch-zoom scale factor; pointer coordinates are divided by this so
  // drawing stays correctly aligned with the page while zoomed in.
  zoomScaleRef?: React.RefObject<number>
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

function resizeCanvasToParent(canvas: HTMLCanvasElement, sizeSource?: Element | null) {
  const parent = sizeSource ?? canvas.parentElement
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

function drawLasso(ctx: CanvasRenderingContext2D, points: StrokePoint[]) {
  if (points.length < 2) return
  ctx.save()
  ctx.globalAlpha = 1
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = '#0a84ff'
  ctx.lineWidth = 1.5
  ctx.fillStyle = 'rgba(10,132,255,0.08)'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// Ray-casting point-in-polygon test.
function pointInPolygon(p: StrokePoint, polygon: StrokePoint[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
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

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas({
  page,
  tool,
  color,
  color2,
  width,
  straight,
  lineDash,
  lineCap,
  pressureFactor,
  shapeAssist,
  rulerAngle,
  shapeKind,
  selectedStrokeIds,
  onStrokeEnd,
  onErase,
  onSelectStrokes,
  onMoveStrokes,
  onPointerDownCapture,
  sizeRef,
  zoomScaleRef,
}, ref) {
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
  const selectModeRef = useRef<'lasso' | 'move' | null>(null)
  const lassoStartRef = useRef<StrokePoint | null>(null)
  const lassoPointsRef = useRef<StrokePoint[]>([])
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

    if (selectModeRef.current === 'lasso' && lassoPointsRef.current.length > 1) {
      drawLasso(ctx, lassoPointsRef.current)
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
      const sizeSource = sizeRef?.current
      if (bgRef.current) resizeCanvasToParent(bgRef.current, sizeSource)
      if (overlayRef.current) resizeCanvasToParent(overlayRef.current, sizeSource)
      redrawBackground()
      redrawOverlay()
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    cancelStroke: () => {
      if (!drawingRef.current) return
      drawingRef.current = false
      currentStrokeRef.current = null
      startPointRef.current = null
      activePointerIdRef.current = null
      redrawOverlay()
    },
  }))

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): StrokePoint => {
    const canvas = overlayRef.current!
    const rect = canvas.getBoundingClientRect()
    const scale = zoomScaleRef?.current || 1
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
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
    selectModeRef.current = 'lasso'
    lassoStartRef.current = point
    lassoPointsRef.current = [point]
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
      dash: lineDash,
      cap: lineCap,
      pressureFactor,
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
      } else if (selectModeRef.current === 'lasso') {
        const last = lassoPointsRef.current[lassoPointsRef.current.length - 1]
        if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 2) {
          lassoPointsRef.current.push(point)
        }
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

    if (rulerAngle != null && startPointRef.current) {
      const start = startPointRef.current
      const cur = getPoint(e)
      const dx = cur.x - start.x
      const dy = cur.y - start.y
      const proj = dx * Math.cos(rulerAngle) + dy * Math.sin(rulerAngle)
      stroke.points = [
        start,
        { x: start.x + Math.cos(rulerAngle) * proj, y: start.y + Math.sin(rulerAngle) * proj, pressure: 1 },
      ]
      redrawOverlay()
      return
    }

    // Apple Pencil coalesced samples can land a fraction of a pixel apart;
    // each extra point costs a full stroke() call in the renderer, so
    // dropping near-duplicates keeps long, fast strokes rendering promptly.
    const MIN_POINT_DIST = 0.5
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    for (const ev of events) {
      const next = getSmoothedPoint(ev)
      const last = stroke.points[stroke.points.length - 1]
      if (last && Math.hypot(next.x - last.x, next.y - last.y) < MIN_POINT_DIST) continue
      stroke.points.push(next)
    }

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

      if (selectModeRef.current === 'lasso' && lassoStartRef.current) {
        const start = lassoStartRef.current
        const lasso = lassoPointsRef.current
        const last = lasso[lasso.length - 1] ?? start
        const tiny = Math.hypot(last.x - start.x, last.y - start.y) < 6 && lasso.length < 4
        selectModeRef.current = null
        lassoStartRef.current = null
        lassoPointsRef.current = []

        if (tiny) {
          const hitId = strokeHitAt(start)
          onSelectStrokes(hitId ? [hitId] : [])
        } else {
          const ids = page.strokes
            .filter((s) => s.points.some((p) => pointInPolygon(p, lasso)))
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
      const finalStroke =
        shapeAssist && tool !== 'shape' && !stroke.straight
          ? { ...stroke, points: applyShapeAssist(stroke.points) }
          : stroke
      onStrokeEnd(finalStroke)
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
})

export default Canvas
