import { useEffect, useRef, useState } from 'react'
import type {
  LineCap,
  LineDash,
  Notebook,
  NotebookCover,
  PageElement,
  PageTemplate,
  ShapeKind,
  Stroke,
  TextElement,
  TextStyle,
  Tool,
} from './types'
import {
  emptyNotebook,
  emptyPage,
  exportBackup,
  importBackupFile,
  loadNotebooks,
  newId,
  saveNotebooks,
} from './storage'
import Toolbar from './Toolbar'
import Canvas, { type CanvasHandle } from './Canvas'
import PageStrip from './PageStrip'
import Library from './Library'
import PageElements, { TEXT_STYLE_PRESETS } from './PageElements'
import NewNotebookModal from './NewNotebookModal'
import TemplatePicker from './TemplatePicker'
import SelectionActionBar from './SelectionActionBar'
import SearchModal from './SearchModal'
import TextFormatBar from './TextFormatBar'
import { templateBackgroundStyle } from './pageTemplates'
import { strokesBBox } from './geometry'
import { importImageFile } from './imageImport'
import './App.css'

const MAX_RECENT_COLORS = 6

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => loadNotebooks())
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState('#1c1c1e')
  const [color2, setColor2] = useState<string | null>(null)
  const [width, setWidth] = useState(2)
  const [straight, setStraight] = useState(false)
  const [lineDash, setLineDash] = useState<LineDash>('solid')
  const [lineCap, setLineCap] = useState<LineCap>('round')
  const [pressureFactor, setPressureFactor] = useState(1)
  const [snapToRuled, setSnapToRuled] = useState(false)
  const [shapeAssist, setShapeAssist] = useState(false)
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([])
  const [shapeKind, setShapeKind] = useState<ShapeKind>('line')
  const [newNotebookOpen, setNewNotebookOpen] = useState(false)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [insertPageAtIndex, setInsertPageAtIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single')
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [importBusy, setImportBusy] = useState<string | null>(null)
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null)
  const [recognizing, setRecognizing] = useState(false)
  const [exportBusy, setExportBusy] = useState<string | null>(null)
  const [zoomPercent, setZoomPercent] = useState<number | null>(null)

  const historyRef = useRef<Notebook[][]>([])
  const futureRef = useRef<Notebook[][]>([])
  const paperRef = useRef<HTMLDivElement>(null)
  const zoomWrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<CanvasHandle>(null)

  // Two-finger pinch-to-zoom on the page. Kept as plain refs (not React
  // state) so each touchmove updates the CSS transform directly — going
  // through setState here would re-render the whole app on every frame.
  const zoomScaleRef = useRef(1)
  const zoomTransformRef = useRef({ scale: 1, tx: 0, ty: 0 })
  const pinchTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartRef = useRef<{
    dist: number
    scale: number
    tx: number
    ty: number
    center: { x: number; y: number }
  } | null>(null)

  const applyZoomTransform = () => {
    const { scale, tx, ty } = zoomTransformRef.current
    zoomScaleRef.current = scale
    if (zoomWrapRef.current) {
      zoomWrapRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
    }
  }

  const resetZoom = () => {
    zoomTransformRef.current = { scale: 1, tx: 0, ty: 0 }
    applyZoomTransform()
    setZoomPercent(null)
  }

  const clampPan = (tx: number, ty: number, scale: number) => {
    const rect = paperRef.current?.getBoundingClientRect()
    const w = rect?.width ?? 0
    const h = rect?.height ?? 0
    const maxX = (w * (scale - 1)) / 2 + 40
    const maxY = (h * (scale - 1)) / 2 + 40
    return {
      tx: Math.max(-maxX, Math.min(maxX, tx)),
      ty: Math.max(-maxY, Math.min(maxY, ty)),
    }
  }

  // Two-finger double-tap = undo, three-finger double-tap = redo — the same
  // gesture Notability/GoodNotes use, so it doesn't compete with pinch (which
  // needs sustained movement) or normal drawing (one finger/pen).
  const tapGestureRef = useRef<{ startTime: number; maxMove: number; peakCount: number } | null>(null)
  const tapOriginsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastTapRef = useRef<{ count: number; time: number } | null>(null)
  const TAP_MAX_DURATION_MS = 300
  const TAP_MAX_MOVE_PX = 12
  const DOUBLE_TAP_WINDOW_MS = 400

  const handleCanvasWrapPointerDownCapture = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    pinchTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    tapOriginsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinchTouchesRef.current.size === 1) {
      tapGestureRef.current = { startTime: Date.now(), maxMove: 0, peakCount: 1 }
    } else if (tapGestureRef.current) {
      tapGestureRef.current.peakCount = Math.max(tapGestureRef.current.peakCount, pinchTouchesRef.current.size)
    }

    if (pinchTouchesRef.current.size === 2) {
      canvasRef.current?.cancelStroke()
      const [a, b] = Array.from(pinchTouchesRef.current.values())
      pinchStartRef.current = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        scale: zoomTransformRef.current.scale,
        tx: zoomTransformRef.current.tx,
        ty: zoomTransformRef.current.ty,
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      }
    }
  }

  const handleCanvasWrapPointerMoveCapture = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    if (!pinchTouchesRef.current.has(e.pointerId)) return
    const origin = tapOriginsRef.current.get(e.pointerId)
    if (origin && tapGestureRef.current) {
      const moved = Math.hypot(e.clientX - origin.x, e.clientY - origin.y)
      tapGestureRef.current.maxMove = Math.max(tapGestureRef.current.maxMove, moved)
    }
    pinchTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinchTouchesRef.current.size !== 2 || !pinchStartRef.current) return

    const [a, b] = Array.from(pinchTouchesRef.current.values())
    const dist = Math.hypot(b.x - a.x, b.y - a.y)
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const start = pinchStartRef.current

    const scale = Math.max(1, Math.min(4, start.scale * (dist / start.dist)))
    const rawTx = start.tx + (center.x - start.center.x)
    const rawTy = start.ty + (center.y - start.center.y)
    const { tx, ty } = clampPan(rawTx, rawTy, scale)

    zoomTransformRef.current = { scale, tx, ty }
    applyZoomTransform()
  }

  const handleCanvasWrapPointerEndCapture = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    pinchTouchesRef.current.delete(e.pointerId)
    tapOriginsRef.current.delete(e.pointerId)
    if (pinchTouchesRef.current.size < 2) {
      pinchStartRef.current = null
      if (pinchTouchesRef.current.size === 0) {
        const { scale } = zoomTransformRef.current
        if (scale <= 1.05) {
          resetZoom()
        } else {
          setZoomPercent(Math.round(scale * 100))
        }

        const gesture = tapGestureRef.current
        tapGestureRef.current = null
        if (
          gesture &&
          gesture.peakCount >= 2 &&
          gesture.maxMove < TAP_MAX_MOVE_PX &&
          Date.now() - gesture.startTime < TAP_MAX_DURATION_MS
        ) {
          const now = Date.now()
          const last = lastTapRef.current
          if (last && last.count === gesture.peakCount && now - last.time < DOUBLE_TAP_WINDOW_MS) {
            lastTapRef.current = null
            if (gesture.peakCount === 2) handleUndo()
            else if (gesture.peakCount === 3) handleRedo()
          } else {
            lastTapRef.current = { count: gesture.peakCount, time: now }
          }
        }
      }
    }
  }

  // Debounced so a burst of strokes (each committing a notebooks update)
  // doesn't re-serialize the whole notebook list — background images especially
  // — to localStorage on every single one, which was showing up as jank.
  const saveTimeoutRef = useRef<number | null>(null)
  useEffect(() => {
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = window.setTimeout(() => {
      const ok = saveNotebooks(notebooks)
      if (!ok) setSaveError('No se pudo guardar: el almacenamiento del navegador está lleno.')
    }, 400)
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    }
  }, [notebooks])

  useEffect(() => {
    setSelectedStrokeIds([])
  }, [tool, activeNotebookId, activePageIndex])

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId) ?? null
  const activePage = activeNotebook?.pages[activePageIndex] ?? null

  const commit = (updater: (notebooks: Notebook[]) => Notebook[]) => {
    historyRef.current.push(notebooks)
    if (historyRef.current.length > 50) historyRef.current.shift()
    futureRef.current = []
    setNotebooks((prev) => updater(prev))
  }

  const updateActiveNotebook = (fn: (nb: Notebook) => Notebook) => {
    commit((prev) =>
      prev.map((nb) => (nb.id === activeNotebookId ? { ...fn(nb), updatedAt: Date.now() } : nb)),
    )
  }

  // Same as above but doesn't push an undo step — used for background OCR
  // indexing, which is metadata, not a user-visible edit.
  const updateActiveNotebookSilent = (fn: (nb: Notebook) => Notebook) => {
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === activeNotebookId ? { ...fn(nb), updatedAt: Date.now() } : nb)),
    )
  }

  const handleColorChange = (c: string) => {
    setColor(c)
    setRecentColors((prev) => [c, ...prev.filter((x) => x !== c)].slice(0, MAX_RECENT_COLORS))
  }

  // Matches the ruled-line background in App.css / pageTemplates.ts: lines sit
  // at y = LINE_OFFSET + n * LINE_PITCH.
  const RULED_LINE_PITCH = 32
  const RULED_LINE_OFFSET = 43.5

  const snapStrokeToRuledLine = (stroke: Stroke): Stroke => {
    if (stroke.points.length === 0) return stroke
    const baselineY = Math.max(...stroke.points.map((p) => p.y))
    const nearestLine =
      RULED_LINE_OFFSET + Math.round((baselineY - RULED_LINE_OFFSET) / RULED_LINE_PITCH) * RULED_LINE_PITCH
    const dy = nearestLine - baselineY
    if (Math.abs(dy) < 0.5) return stroke
    return { ...stroke, points: stroke.points.map((p) => ({ ...p, y: p.y + dy })) }
  }

  const handleStrokeEnd = (pageIndex: number, stroke: Stroke) => {
    const page = activeNotebook?.pages[pageIndex]
    const finalStroke = snapToRuled && page?.template === 'lined' ? snapStrokeToRuledLine(stroke) : stroke
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === pageIndex ? { ...p, strokes: [...p.strokes, finalStroke] } : p,
      ),
    }))
  }

  const handleErase = (pageIndex: number, strokeIds: string[]) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === pageIndex
          ? { ...p, strokes: p.strokes.filter((s) => !strokeIds.includes(s.id)) }
          : p,
      ),
    }))
  }

  const handleMoveStrokes = (ids: string[], dx: number, dy: number) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex
          ? {
              ...p,
              strokes: p.strokes.map((s) =>
                ids.includes(s.id)
                  ? { ...s, points: s.points.map((pt) => ({ ...pt, x: pt.x + dx, y: pt.y + dy })) }
                  : s,
              ),
            }
          : p,
      ),
    }))
  }

  const handleRecolorSelectedStrokes = (newColor: string) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex
          ? {
              ...p,
              strokes: p.strokes.map((s) =>
                selectedStrokeIds.includes(s.id) ? { ...s, color: newColor } : s,
              ),
            }
          : p,
      ),
    }))
  }

  const handleDeleteSelectedStrokes = () => {
    handleErase(activePageIndex, selectedStrokeIds)
    setSelectedStrokeIds([])
  }

  const handleElementChange = (element: PageElement) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex
          ? { ...p, elements: p.elements.map((el) => (el.id === element.id ? element : el)) }
          : p,
      ),
    }))
  }

  const handleTextStyleChange = (id: string, style: Partial<TextStyle>) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex
          ? {
              ...p,
              elements: p.elements.map((el) =>
                el.id === id && el.type === 'text' ? { ...el, style: { ...el.style, ...style } } : el,
              ),
            }
          : p,
      ),
    }))
  }

  const handleElementDelete = (id: string) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex ? { ...p, elements: p.elements.filter((el) => el.id !== id) } : p,
      ),
    }))
    setSelectedElementId(null)
  }

  const handleAddText = () => {
    const el: TextElement = {
      id: newId(),
      type: 'text',
      x: 80,
      y: 80,
      w: 180,
      h: 60,
      text: '',
      style: TEXT_STYLE_PRESETS[0],
    }
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex ? { ...p, elements: [...p.elements, el] } : p,
      ),
    }))
    setTool('select')
    setSelectedElementId(el.id)
  }

  const handleAddSticker = (emoji: string) => {
    const el: PageElement = {
      id: newId(),
      type: 'sticker',
      x: 120,
      y: 120,
      size: 48,
      emoji,
    }
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex ? { ...p, elements: [...p.elements, el] } : p,
      ),
    }))
    setTool('select')
  }

  const handleImportImage = async (file: File) => {
    setImportBusy('Importando…')
    try {
      const dataUrl = await importImageFile(file)
      updateActiveNotebook((nb) => ({
        ...nb,
        pages: nb.pages.map((p, i) => (i === activePageIndex ? { ...p, background: dataUrl } : p)),
      }))
    } catch (err) {
      console.error('No se pudo importar la imagen', err)
    } finally {
      setImportBusy(null)
    }
  }

  const handleImportPdf = async (file: File) => {
    setImportBusy('Cargando PDF…')
    try {
      const { importPdfFile } = await import('./pdfImport')
      const images = await importPdfFile(file)
      if (images.length === 0) return
      const nextIndex = activeNotebook?.pages.length ?? 0
      updateActiveNotebook((nb) => ({
        ...nb,
        pages: [...nb.pages, ...images.map((img) => emptyPage('blank', img))],
      }))
      setActivePageIndex(nextIndex)
    } catch (err) {
      console.error('No se pudo importar el PDF', err)
    } finally {
      setImportBusy(null)
    }
  }

  const handleRecognizeSelectedStrokes = async () => {
    if (!activePage) return
    const strokes = activePage.strokes.filter((s) => selectedStrokeIds.includes(s.id))
    if (strokes.length === 0) return
    setRecognizing(true)
    try {
      const { strokesToDataURL, recognizeDataURL } = await import('./ocr')
      const dataUrl = strokesToDataURL(strokes)
      if (!dataUrl) return
      const text = await recognizeDataURL(dataUrl)
      if (text) {
        const box = strokesBBox(strokes)!
        const el: TextElement = {
          id: newId(),
          type: 'text',
          x: box.minX,
          y: box.maxY + 12,
          w: Math.max(140, box.maxX - box.minX),
          h: 60,
          text,
          style: TEXT_STYLE_PRESETS[0],
        }
        updateActiveNotebook((nb) => ({
          ...nb,
          pages: nb.pages.map((p, i) =>
            i === activePageIndex ? { ...p, elements: [...p.elements, el] } : p,
          ),
        }))
        setSelectedStrokeIds([])
      }
    } catch (err) {
      console.error('No se pudo reconocer el texto', err)
    } finally {
      setRecognizing(false)
    }
  }

  const handleIndexNotebook = async () => {
    if (!activeNotebook) return
    const rect = paperRef.current?.getBoundingClientRect()
    const pageWidth = Math.max(200, Math.round(rect?.width ?? 800))
    const pageHeight = Math.max(200, Math.round(rect?.height ?? 1000))
    const pages = activeNotebook.pages
    const results: { index: number; text: string }[] = []
    const { pageToDataURL, recognizeDataURL } = await import('./ocr')

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      if (page.strokes.length === 0 && !page.background) continue
      setIndexingStatus(`Indexando ${i + 1}/${pages.length}`)
      try {
        const dataUrl = await pageToDataURL(page.strokes, page.background, pageWidth, pageHeight)
        const text = await recognizeDataURL(dataUrl)
        results.push({ index: i, text })
      } catch (err) {
        console.error('No se pudo indexar la página', i, err)
      }
    }

    updateActiveNotebookSilent((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) => {
        const r = results.find((x) => x.index === i)
        return r ? { ...p, ocrText: r.text } : p
      }),
    }))
    setIndexingStatus(null)
  }

  const getPageSize = () => {
    const rect = paperRef.current?.getBoundingClientRect()
    return {
      width: Math.max(200, Math.round(rect?.width ?? 800)),
      height: Math.max(200, Math.round(rect?.height ?? 1000)),
    }
  }

  const handleExportPageImage = async () => {
    if (!activePage || !activeNotebook) return
    setExportBusy('Exportando…')
    try {
      const { exportPageAsImage } = await import('./export')
      const { width, height } = getPageSize()
      const filename = `${activeNotebook.name || 'pagina'}-${activePageIndex + 1}.png`
      await exportPageAsImage(activePage, width, height, filename)
    } catch (err) {
      console.error('No se pudo exportar la página', err)
    } finally {
      setExportBusy(null)
    }
  }

  const handleExportNotebookPdf = async () => {
    if (!activeNotebook) return
    setExportBusy('Generando PDF…')
    try {
      const { exportNotebookAsPdf } = await import('./export')
      const { width, height } = getPageSize()
      await exportNotebookAsPdf(activeNotebook, width, height)
    } catch (err) {
      console.error('No se pudo exportar el PDF', err)
    } finally {
      setExportBusy(null)
    }
  }

  const handleSharePage = async () => {
    if (!activePage || !activeNotebook) return
    setExportBusy('Compartiendo…')
    try {
      const { sharePageImage } = await import('./export')
      const { width, height } = getPageSize()
      const filename = `${activeNotebook.name || 'pagina'}-${activePageIndex + 1}.png`
      await sharePageImage(activePage, width, height, filename)
    } catch (err) {
      console.error('No se pudo compartir la página', err)
    } finally {
      setExportBusy(null)
    }
  }

  const handleAddPage = (template: PageTemplate) => {
    const nextIndex = activeNotebook?.pages.length ?? 0
    updateActiveNotebook((nb) => ({ ...nb, pages: [...nb.pages, emptyPage(template)] }))
    setActivePageIndex(nextIndex)
    setTemplatePickerOpen(false)
  }

  const handleDeletePage = (index: number) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.filter((_, i) => i !== index),
    }))
    setActivePageIndex((i) => (i >= index && i > 0 ? i - 1 : i))
  }

  const handleDuplicatePage = (index: number) => {
    updateActiveNotebook((nb) => {
      const source = nb.pages[index]
      const copy = {
        ...source,
        id: newId(),
        strokes: source.strokes.map((s) => ({ ...s, id: newId() })),
        elements: source.elements.map((el) => ({ ...el, id: newId() })),
      }
      const pages = [...nb.pages]
      pages.splice(index + 1, 0, copy)
      return { ...nb, pages }
    })
    setActivePageIndex(index + 1)
  }

  const handleInsertPageAt = (index: number, template: PageTemplate) => {
    updateActiveNotebook((nb) => {
      const pages = [...nb.pages]
      pages.splice(index, 0, emptyPage(template))
      return { ...nb, pages }
    })
    setActivePageIndex(index)
    setTemplatePickerOpen(false)
    setInsertPageAtIndex(null)
  }

  const handleReorderPages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    updateActiveNotebook((nb) => {
      const pages = [...nb.pages]
      const [moved] = pages.splice(fromIndex, 1)
      pages.splice(toIndex, 0, moved)
      return { ...nb, pages }
    })
    setActivePageIndex((i) => {
      if (i === fromIndex) return toIndex
      if (fromIndex < i && i <= toIndex) return i - 1
      if (toIndex <= i && i < fromIndex) return i + 1
      return i
    })
  }

  const handleUndo = () => {
    const prev = historyRef.current.pop()
    if (!prev) return
    futureRef.current.push(notebooks)
    setNotebooks(prev)
  }

  const handleRedo = () => {
    const next = futureRef.current.pop()
    if (!next) return
    historyRef.current.push(notebooks)
    setNotebooks(next)
  }

  const handleCreateNotebook = (name: string, cover: NotebookCover) => {
    const nb = emptyNotebook(name, cover)
    commit((prev) => [...prev, nb])
    setActiveNotebookId(nb.id)
    setActivePageIndex(0)
    setNewNotebookOpen(false)
  }

  const handleDeleteNotebook = (id: string) => {
    commit((prev) => prev.filter((n) => n.id !== id))
  }

  const handleToggleFavorite = (id: string) => {
    setNotebooks((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n)))
  }

  const handleSetFolder = (id: string, folder: string | null) => {
    setNotebooks((prev) => prev.map((n) => (n.id === id ? { ...n, folder } : n)))
  }

  const handleSetTags = (id: string, tags: string[]) => {
    setNotebooks((prev) => prev.map((n) => (n.id === id ? { ...n, tags } : n)))
  }

  const handleExportBackup = () => {
    exportBackup(notebooks)
  }

  const handleImportBackup = async (file: File) => {
    setBackupStatus('Importando…')
    try {
      const imported = await importBackupFile(file)
      commit((prev) => [...prev, ...imported])
      setBackupStatus(`${imported.length} cuaderno(s) importado(s)`)
    } catch (err) {
      console.error('No se pudo importar la copia de seguridad', err)
      setBackupStatus('No se pudo importar el archivo')
    } finally {
      setTimeout(() => setBackupStatus(null), 3000)
    }
  }

  if (!activeNotebook || !activePage) {
    return (
      <>
        {saveError && (
          <div className="save-error-banner">
            ⚠️ {saveError}
            <button onClick={() => setSaveError(null)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}
        <Library
          notebooks={notebooks}
          onOpen={(id) => {
            setActiveNotebookId(id)
            setActivePageIndex(0)
          }}
          onCreate={() => setNewNotebookOpen(true)}
          onDelete={handleDeleteNotebook}
          onSearch={() => setSearchOpen(true)}
          onToggleFavorite={handleToggleFavorite}
          onSetFolder={handleSetFolder}
          onSetTags={handleSetTags}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          backupStatus={backupStatus}
        />
        {newNotebookOpen && (
          <NewNotebookModal
            onCreate={handleCreateNotebook}
            onClose={() => setNewNotebookOpen(false)}
          />
        )}
        {searchOpen && (
          <SearchModal
            notebooks={notebooks}
            onClose={() => setSearchOpen(false)}
            onOpenResult={(notebookId, pageIndex) => {
              setActiveNotebookId(notebookId)
              setActivePageIndex(pageIndex)
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="app">
      {saveError && (
        <div className="save-error-banner">
          ⚠️ {saveError}
          <button onClick={() => setSaveError(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}
      <Toolbar
        notebookName={activeNotebook.name}
        tool={tool}
        color={color}
        color2={color2}
        width={width}
        straight={straight}
        lineDash={lineDash}
        lineCap={lineCap}
        pressureFactor={pressureFactor}
        snapToRuled={snapToRuled}
        shapeAssist={shapeAssist}
        pageTemplate={activePage.template}
        shapeKind={shapeKind}
        recentColors={recentColors}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        onToolChange={setTool}
        onColorChange={handleColorChange}
        onColor2Change={setColor2}
        onWidthChange={setWidth}
        onStraightToggle={() => setStraight((v) => !v)}
        onLineDashChange={setLineDash}
        onLineCapChange={setLineCap}
        onPressureFactorChange={setPressureFactor}
        onSnapToRuledToggle={() => setSnapToRuled((v) => !v)}
        onShapeAssistToggle={() => setShapeAssist((v) => !v)}
        onShapeKindChange={setShapeKind}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddPage={() => setTemplatePickerOpen(true)}
        onBack={() => setActiveNotebookId(null)}
        onOpenText={handleAddText}
        onPickSticker={handleAddSticker}
        onImportImage={handleImportImage}
        onImportPdf={handleImportPdf}
        importBusy={importBusy}
        onIndexNotebook={handleIndexNotebook}
        indexingStatus={indexingStatus}
        onExportPageImage={handleExportPageImage}
        onExportNotebookPdf={handleExportNotebookPdf}
        onSharePage={handleSharePage}
        canShare={canShare}
        exportBusy={exportBusy}
        viewMode={viewMode}
        onViewModeToggle={() => setViewMode((v) => (v === 'single' ? 'continuous' : 'single'))}
      />
      {templatePickerOpen && (
        <TemplatePicker
          onPick={
            insertPageAtIndex !== null
              ? (template) => handleInsertPageAt(insertPageAtIndex, template)
              : handleAddPage
          }
          onClose={() => {
            setTemplatePickerOpen(false)
            setInsertPageAtIndex(null)
          }}
        />
      )}
      {viewMode === 'single' ? (
        <div
          className="canvas-wrap"
          onPointerDown={() => setSelectedElementId(null)}
          onPointerDownCapture={handleCanvasWrapPointerDownCapture}
          onPointerMoveCapture={handleCanvasWrapPointerMoveCapture}
          onPointerUpCapture={handleCanvasWrapPointerEndCapture}
          onPointerCancelCapture={handleCanvasWrapPointerEndCapture}
        >
          <div
            ref={paperRef}
            className="paper"
            style={{
              ...templateBackgroundStyle(activePage.template),
              ...(activePage.background
                ? {
                    backgroundImage: `url(${activePage.background})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}),
            }}
          >
            <div ref={zoomWrapRef} className="paper-zoom">
              <Canvas
                key={activePage.id}
                ref={canvasRef}
                page={activePage}
                tool={tool}
                color={color}
                color2={color2}
                width={width}
                straight={straight}
                lineDash={lineDash}
                lineCap={lineCap}
                pressureFactor={pressureFactor}
                shapeAssist={shapeAssist}
                shapeKind={shapeKind}
                selectedStrokeIds={selectedStrokeIds}
                onStrokeEnd={(stroke) => handleStrokeEnd(activePageIndex, stroke)}
                onErase={(ids) => handleErase(activePageIndex, ids)}
                onSelectStrokes={setSelectedStrokeIds}
                onMoveStrokes={handleMoveStrokes}
                sizeRef={paperRef}
                zoomScaleRef={zoomScaleRef}
              />
              <PageElements
                elements={activePage.elements}
                selectedId={selectedElementId}
                onSelect={setSelectedElementId}
                onChange={handleElementChange}
                onDelete={handleElementDelete}
              />
              {tool === 'select' &&
                selectedElementId &&
                (() => {
                  const el = activePage.elements.find((e) => e.id === selectedElementId)
                  if (!el || el.type !== 'text') return null
                  return (
                    <TextFormatBar
                      left={el.x}
                      top={Math.max(8, el.y - 60)}
                      element={el}
                      onChangeStyle={(style) => handleTextStyleChange(el.id, style)}
                      onDelete={() => handleElementDelete(el.id)}
                    />
                  )
                })()}
              {tool === 'select' &&
                selectedStrokeIds.length > 0 &&
                (() => {
                  const box = strokesBBox(activePage.strokes.filter((s) => selectedStrokeIds.includes(s.id)))
                  if (!box) return null
                  return (
                    <SelectionActionBar
                      left={(box.minX + box.maxX) / 2}
                      top={Math.max(8, box.minY - 56)}
                      recognizing={recognizing}
                      onRecolor={handleRecolorSelectedStrokes}
                      onDelete={handleDeleteSelectedStrokes}
                      onRecognizeText={handleRecognizeSelectedStrokes}
                    />
                  )
                })()}
            </div>
          </div>
          {zoomPercent !== null && (
            <button className="zoom-reset-btn" onClick={resetZoom} aria-label="Restablecer zoom">
              ↺ {zoomPercent}%
            </button>
          )}
        </div>
      ) : (
        <div className="canvas-wrap continuous-wrap" onPointerDown={() => setSelectedElementId(null)}>
          <div className="continuous-scroll">
            {activeNotebook.pages.map((page, i) => (
              <div
                key={page.id}
                className={`paper continuous-page ${i === activePageIndex ? 'active' : ''}`}
                ref={i === activePageIndex ? paperRef : undefined}
                onPointerDownCapture={() => setActivePageIndex(i)}
                style={{
                  ...templateBackgroundStyle(page.template),
                  ...(page.background
                    ? {
                        backgroundImage: `url(${page.background})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                      }
                    : {}),
                }}
              >
                <Canvas
                  key={page.id}
                  page={page}
                  tool={tool}
                  color={color}
                  color2={color2}
                  width={width}
                  straight={straight}
                  lineDash={lineDash}
                  lineCap={lineCap}
                  pressureFactor={pressureFactor}
                  shapeAssist={shapeAssist}
                  shapeKind={shapeKind}
                  selectedStrokeIds={i === activePageIndex ? selectedStrokeIds : []}
                  onStrokeEnd={(stroke) => handleStrokeEnd(i, stroke)}
                  onErase={(ids) => handleErase(i, ids)}
                  onSelectStrokes={setSelectedStrokeIds}
                  onMoveStrokes={handleMoveStrokes}
                />
                <PageElements
                  elements={page.elements}
                  selectedId={i === activePageIndex ? selectedElementId : null}
                  onSelect={setSelectedElementId}
                  onChange={handleElementChange}
                  onDelete={handleElementDelete}
                />
                {i === activePageIndex &&
                  tool === 'select' &&
                  selectedElementId &&
                  (() => {
                    const el = page.elements.find((e) => e.id === selectedElementId)
                    if (!el || el.type !== 'text') return null
                    return (
                      <TextFormatBar
                        left={el.x}
                        top={Math.max(8, el.y - 60)}
                        element={el}
                        onChangeStyle={(style) => handleTextStyleChange(el.id, style)}
                        onDelete={() => handleElementDelete(el.id)}
                      />
                    )
                  })()}
                {i === activePageIndex &&
                  tool === 'select' &&
                  selectedStrokeIds.length > 0 &&
                  (() => {
                    const box = strokesBBox(page.strokes.filter((s) => selectedStrokeIds.includes(s.id)))
                    if (!box) return null
                    return (
                      <SelectionActionBar
                        left={(box.minX + box.maxX) / 2}
                        top={Math.max(8, box.minY - 56)}
                        recognizing={recognizing}
                        onRecolor={handleRecolorSelectedStrokes}
                        onDelete={handleDeleteSelectedStrokes}
                        onRecognizeText={handleRecognizeSelectedStrokes}
                      />
                    )
                  })()}
                <span className="continuous-page-number">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <PageStrip
        pages={activeNotebook.pages}
        activeIndex={activePageIndex}
        onSelect={setActivePageIndex}
        onDelete={handleDeletePage}
        onDuplicate={handleDuplicatePage}
        onInsertAt={(index) => {
          setInsertPageAtIndex(index)
          setTemplatePickerOpen(true)
        }}
        onReorder={handleReorderPages}
      />
    </div>
  )
}
