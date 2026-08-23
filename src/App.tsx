import { useEffect, useRef, useState } from 'react'
import type {
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
import { emptyNotebook, emptyPage, loadNotebooks, newId, saveNotebooks } from './storage'
import Toolbar from './Toolbar'
import Canvas from './Canvas'
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
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([])
  const [shapeKind, setShapeKind] = useState<ShapeKind>('line')
  const [newNotebookOpen, setNewNotebookOpen] = useState(false)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [importBusy, setImportBusy] = useState<string | null>(null)
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null)
  const [recognizing, setRecognizing] = useState(false)
  const [exportBusy, setExportBusy] = useState<string | null>(null)

  const historyRef = useRef<Notebook[][]>([])
  const futureRef = useRef<Notebook[][]>([])
  const paperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveNotebooks(notebooks)
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

  const handleStrokeEnd = (stroke: Stroke) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex ? { ...p, strokes: [...p.strokes, stroke] } : p,
      ),
    }))
  }

  const handleErase = (strokeIds: string[]) => {
    updateActiveNotebook((nb) => ({
      ...nb,
      pages: nb.pages.map((p, i) =>
        i === activePageIndex
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
    handleErase(selectedStrokeIds)
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

  if (!activeNotebook || !activePage) {
    return (
      <>
        <Library
          notebooks={notebooks}
          onOpen={(id) => {
            setActiveNotebookId(id)
            setActivePageIndex(0)
          }}
          onCreate={() => setNewNotebookOpen(true)}
          onDelete={handleDeleteNotebook}
          onSearch={() => setSearchOpen(true)}
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
      <Toolbar
        notebookName={activeNotebook.name}
        tool={tool}
        color={color}
        color2={color2}
        width={width}
        straight={straight}
        shapeKind={shapeKind}
        recentColors={recentColors}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        onToolChange={setTool}
        onColorChange={handleColorChange}
        onColor2Change={setColor2}
        onWidthChange={setWidth}
        onStraightToggle={() => setStraight((v) => !v)}
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
      />
      {templatePickerOpen && (
        <TemplatePicker onPick={handleAddPage} onClose={() => setTemplatePickerOpen(false)} />
      )}
      <div className="canvas-wrap" onPointerDown={() => setSelectedElementId(null)}>
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
          <Canvas
            key={activePage.id}
            page={activePage}
            tool={tool}
            color={color}
            color2={color2}
            width={width}
            straight={straight}
            shapeKind={shapeKind}
            selectedStrokeIds={selectedStrokeIds}
            onStrokeEnd={handleStrokeEnd}
            onErase={handleErase}
            onSelectStrokes={setSelectedStrokeIds}
            onMoveStrokes={handleMoveStrokes}
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
      <PageStrip
        pages={activeNotebook.pages}
        activeIndex={activePageIndex}
        onSelect={setActivePageIndex}
        onDelete={handleDeletePage}
      />
    </div>
  )
}
