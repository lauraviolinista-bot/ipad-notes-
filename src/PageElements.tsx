import { useRef, useState } from 'react'
import type { PageElement, TextElement, TextStyle } from './types'
import { FONT_STACKS } from './fonts'

const BASE_TEXT_STYLE = { fontFamily: 'sans', fontSize: 16, bold: false, italic: false, align: 'left' } as const

export const TEXT_STYLE_PRESETS: TextStyle[] = [
  { fill: null, border: null, textColor: '#1c1c1e', ...BASE_TEXT_STYLE },
  { fill: '#ff6b6b', border: null, textColor: '#ffffff', ...BASE_TEXT_STYLE },
  { fill: '#4a90ff', border: null, textColor: '#ffffff', ...BASE_TEXT_STYLE },
  { fill: '#f5a623', border: null, textColor: '#ffffff', ...BASE_TEXT_STYLE },
  { fill: '#b57cff', border: null, textColor: '#ffffff', ...BASE_TEXT_STYLE },
  { fill: '#4ecb71', border: null, textColor: '#ffffff', ...BASE_TEXT_STYLE },
  { fill: null, border: '#1c1c1e', textColor: '#1c1c1e', ...BASE_TEXT_STYLE },
  { fill: null, border: '#ff6b6b', textColor: '#1c1c1e', ...BASE_TEXT_STYLE },
  { fill: null, border: '#4a90ff', textColor: '#1c1c1e', ...BASE_TEXT_STYLE },
]

interface PageElementsProps {
  elements: PageElement[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (element: PageElement) => void
  onDelete: (id: string) => void
}

export default function PageElements({
  elements,
  selectedId,
  onSelect,
  onChange,
  onDelete,
}: PageElementsProps) {
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent, el: PageElement) => {
    e.stopPropagation()
    onSelect(el.id)
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    dragRef.current = { id: el.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
    target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const el = elements.find((x) => x.id === drag.id)
    if (!el) return
    const parent = (e.currentTarget as HTMLElement).parentElement
    if (!parent) return
    const parentRect = parent.getBoundingClientRect()
    const x = e.clientX - parentRect.left - drag.offsetX
    const y = e.clientY - parentRect.top - drag.offsetY
    onChange({ ...el, x, y } as PageElement)
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  return (
    <>
      {elements.map((el) =>
        el.type === 'text' ? (
          <TextBox
            key={el.id}
            el={el}
            selected={selectedId === el.id}
            onPointerDown={(e) => handlePointerDown(e, el)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onChange={onChange}
            onDelete={onDelete}
          />
        ) : (
          <div
            key={el.id}
            className={`sticker-el ${selectedId === el.id ? 'selected' : ''}`}
            style={{ left: el.x, top: el.y, fontSize: el.size }}
            onPointerDown={(e) => handlePointerDown(e, el)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {el.emoji}
            {selectedId === el.id && (
              <button className="el-delete" onClick={() => onDelete(el.id)}>
                ×
              </button>
            )}
          </div>
        ),
      )}
    </>
  )
}

function TextBox({
  el,
  selected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onChange,
  onDelete,
}: {
  el: TextElement
  selected: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: () => void
  onChange: (element: PageElement) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const textStyle: React.CSSProperties = {
    fontFamily: FONT_STACKS[el.style.fontFamily],
    fontSize: el.style.fontSize,
    fontWeight: el.style.bold ? 700 : 400,
    fontStyle: el.style.italic ? 'italic' : 'normal',
    textAlign: el.style.align,
  }

  return (
    <div
      className={`text-el ${selected ? 'selected' : ''}`}
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        minHeight: el.h,
        background: el.style.fill ?? 'transparent',
        border: el.style.border ? `2px solid ${el.style.border}` : 'none',
        color: el.style.textColor,
        ...textStyle,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          autoFocus
          value={el.text}
          onChange={(e) => onChange({ ...el, text: e.target.value })}
          onBlur={() => setEditing(false)}
          style={{ color: el.style.textColor, ...textStyle }}
        />
      ) : (
        <span>{el.text || 'Texto'}</span>
      )}
      {selected && (
        <button className="el-delete" onClick={() => onDelete(el.id)}>
          ×
        </button>
      )}
    </div>
  )
}
