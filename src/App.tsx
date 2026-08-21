import { useEffect, useRef, useState } from 'react'
import type {
  Notebook,
  NotebookCover,
  PageElement,
  PageTemplate,
  PenType,
  Stroke,
  TextElement,
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
import { templateBackgroundStyle } from './pageTemplates'
import './App.css'

const MAX_RECENT_COLORS = 6

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => loadNotebooks())
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState('#1c1c1e')
  const [width, setWidth] = useState(2)
  const [straight, setStraight] = useState(false)
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [newNotebookOpen, setNewNotebookOpen] = useState(false)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)

  const historyRef = useRef<Notebook[][]>([])
  const futureRef = useRef<Notebook[][]>([])

  useEffect(() => {
    saveNotebooks(notebooks)
  }, [notebooks])

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
        />
        {newNotebookOpen && (
          <NewNotebookModal
            onCreate={handleCreateNotebook}
            onClose={() => setNewNotebookOpen(false)}
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
        width={width}
        straight={straight}
        recentColors={recentColors}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        onToolChange={setTool}
        onColorChange={handleColorChange}
        onWidthChange={setWidth}
        onStraightToggle={() => setStraight((v) => !v)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddPage={() => setTemplatePickerOpen(true)}
        onBack={() => setActiveNotebookId(null)}
        onOpenText={handleAddText}
        onPickSticker={handleAddSticker}
      />
      {templatePickerOpen && (
        <TemplatePicker onPick={handleAddPage} onClose={() => setTemplatePickerOpen(false)} />
      )}
      <div className="canvas-wrap" onPointerDown={() => setSelectedElementId(null)}>
        <div className="paper" style={templateBackgroundStyle(activePage.template)}>
          <Canvas
            key={activePage.id}
            page={activePage}
            tool={tool === 'select' ? null : (tool as PenType | 'eraser')}
            color={color}
            width={width}
            straight={straight}
            onStrokeEnd={handleStrokeEnd}
            onErase={handleErase}
          />
          <PageElements
            elements={activePage.elements}
            selectedId={selectedElementId}
            onSelect={setSelectedElementId}
            onChange={handleElementChange}
            onDelete={handleElementDelete}
          />
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
