import { useEffect, useRef, useState } from 'react'
import type { Notebook, Stroke, Tool } from './types'
import { emptyNotebook, emptyPage, loadNotebooks, saveNotebooks } from './storage'
import Toolbar from './Toolbar'
import Canvas from './Canvas'
import PageStrip from './PageStrip'
import Library from './Library'
import './App.css'

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => loadNotebooks())
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#1c1c1e')
  const [width, setWidth] = useState(4)

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

  const handleAddPage = () => {
    const nextIndex = activeNotebook?.pages.length ?? 0
    updateActiveNotebook((nb) => ({ ...nb, pages: [...nb.pages, emptyPage()] }))
    setActivePageIndex(nextIndex)
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

  const handleCreateNotebook = () => {
    const name = `Cuaderno ${notebooks.length + 1}`
    const nb = emptyNotebook(name)
    commit((prev) => [...prev, nb])
    setActiveNotebookId(nb.id)
    setActivePageIndex(0)
  }

  const handleDeleteNotebook = (id: string) => {
    commit((prev) => prev.filter((n) => n.id !== id))
  }

  if (!activeNotebook || !activePage) {
    return (
      <Library
        notebooks={notebooks}
        onOpen={(id) => {
          setActiveNotebookId(id)
          setActivePageIndex(0)
        }}
        onCreate={handleCreateNotebook}
        onDelete={handleDeleteNotebook}
      />
    )
  }

  return (
    <div className="app">
      <Toolbar
        notebookName={activeNotebook.name}
        tool={tool}
        color={color}
        width={width}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        onToolChange={setTool}
        onColorChange={setColor}
        onWidthChange={setWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddPage={handleAddPage}
        onBack={() => setActiveNotebookId(null)}
      />
      <Canvas
        key={activePage.id}
        page={activePage}
        tool={tool}
        color={color}
        width={width}
        onStrokeEnd={handleStrokeEnd}
        onErase={handleErase}
      />
      <PageStrip
        pages={activeNotebook.pages}
        activeIndex={activePageIndex}
        onSelect={setActivePageIndex}
        onDelete={handleDeletePage}
      />
    </div>
  )
}
