import { useRef, useState } from 'react'
import type { Page } from './types'

interface PageStripProps {
  pages: Page[]
  activeIndex: number
  onSelect: (index: number) => void
  onDelete: (index: number) => void
  onDuplicate: (index: number) => void
  onInsertAt: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

const DRAG_START_THRESHOLD_PX = 8

export default function PageStrip({
  pages,
  activeIndex,
  onSelect,
  onDelete,
  onDuplicate,
  onInsertAt,
  onReorder,
}: PageStripProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const pointerStateRef = useRef<{
    pointerId: number
    startIndex: number
    startX: number
    dragging: boolean
  } | null>(null)

  // Pointer-based drag instead of native HTML5 drag-and-drop — the native API
  // doesn't fire on touch at all, which would silently break reordering on iPad.
  const indexAtClientX = (clientX: number): number | null => {
    const nav = navRef.current
    if (!nav) return null
    const thumbs = Array.from(nav.querySelectorAll<HTMLElement>('[data-page-index]'))
    for (const el of thumbs) {
      const rect = el.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right) {
        return Number(el.dataset.pageIndex)
      }
    }
    if (thumbs.length === 0) return null
    const firstRect = thumbs[0].getBoundingClientRect()
    if (clientX < firstRect.left) return 0
    return thumbs.length - 1
  }

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    pointerStateRef.current = { pointerId: e.pointerId, startIndex: index, startX: e.clientX, dragging: false }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = pointerStateRef.current
    if (!state || state.pointerId !== e.pointerId) return
    if (!state.dragging) {
      if (Math.abs(e.clientX - state.startX) < DRAG_START_THRESHOLD_PX) return
      state.dragging = true
      setDragIndex(state.startIndex)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
    const idx = indexAtClientX(e.clientX)
    setOverIndex(idx)
  }

  const endDrag = (e: React.PointerEvent) => {
    const state = pointerStateRef.current
    if (!state || state.pointerId !== e.pointerId) return
    if (state.dragging && overIndex !== null && overIndex !== state.startIndex) {
      onReorder(state.startIndex, overIndex)
    } else if (!state.dragging) {
      onSelect(state.startIndex)
    }
    pointerStateRef.current = null
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <nav className="page-strip" ref={navRef}>
      <button
        className="insert-page-gap"
        onClick={() => onInsertAt(0)}
        aria-label="Insertar página al inicio"
        title="Insertar página aquí"
      >
        +
      </button>
      {pages.map((page, i) => (
        <div key={page.id} className="page-thumb-group">
          <div
            className={`page-thumb ${i === activeIndex ? 'active' : ''} ${dragIndex === i ? 'dragging' : ''} ${overIndex === i && dragIndex !== null && dragIndex !== i ? 'drag-over' : ''}`}
            data-page-index={i}
            onPointerDown={(e) => handlePointerDown(e, i)}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="page-thumb-number">{i + 1}</span>
            <button
              className="duplicate-page"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(i)
              }}
              aria-label={`Duplicar página ${i + 1}`}
              title="Duplicar página"
            >
              ⧉
            </button>
            {pages.length > 1 && (
              <button
                className="delete-page"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(i)
                }}
                aria-label={`Eliminar página ${i + 1}`}
              >
                ×
              </button>
            )}
          </div>
          <button
            className="insert-page-gap"
            onClick={() => onInsertAt(i + 1)}
            aria-label={`Insertar página después de ${i + 1}`}
            title="Insertar página aquí"
          >
            +
          </button>
        </div>
      ))}
    </nav>
  )
}
