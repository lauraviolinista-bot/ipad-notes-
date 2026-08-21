import { useRef, useState } from 'react'
import type { PenType, Tool } from './types'
import { getPenPreset } from './penTypes'
import ColorPicker from './ColorPicker'
import BrushLibrary from './BrushLibrary'
import Popover from './Popover'
import StickerPicker from './StickerPicker'

interface ToolbarProps {
  notebookName: string
  tool: Tool
  color: string
  width: number
  straight: boolean
  recentColors: string[]
  canUndo: boolean
  canRedo: boolean
  onToolChange: (t: Tool) => void
  onColorChange: (c: string) => void
  onWidthChange: (w: number) => void
  onStraightToggle: () => void
  onUndo: () => void
  onRedo: () => void
  onAddPage: () => void
  onBack: () => void
  onOpenText: () => void
  onPickSticker: (emoji: string) => void
}

export default function Toolbar({
  notebookName,
  tool,
  color,
  width,
  straight,
  recentColors,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onWidthChange,
  onStraightToggle,
  onUndo,
  onRedo,
  onAddPage,
  onBack,
  onOpenText,
  onPickSticker,
}: ToolbarProps) {
  const [brushLibraryOpen, setBrushLibraryOpen] = useState(false)
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false)
  const [stickerPopoverOpen, setStickerPopoverOpen] = useState(false)
  const penButtonRef = useRef<HTMLButtonElement>(null)
  const styleButtonRef = useRef<HTMLButtonElement>(null)
  const stickerButtonRef = useRef<HTMLButtonElement>(null)

  const isPenTool = tool !== 'eraser' && tool !== 'select'
  const activePreset = isPenTool ? getPenPreset(tool as PenType) : null

  const selectPen = (id: PenType) => {
    onToolChange(id)
    const preset = getPenPreset(id)
    onWidthChange(preset.defaultWidth)
    setStylePopoverOpen(true)
  }

  const closePopovers = () => {
    setBrushLibraryOpen(false)
    setStylePopoverOpen(false)
  }

  return (
    <header className="toolbar">
      <div className="toolbar-row toolbar-row-top">
        <button className="icon-btn" onClick={onBack} aria-label="Volver a notebooks">
          ‹ Cuadernos
        </button>
        <span className="notebook-title">{notebookName}</span>
        <div className="toolbar-spacer" />
        <button className="icon-btn" onClick={onUndo} disabled={!canUndo} aria-label="Deshacer">
          ↩︎
        </button>
        <button className="icon-btn" onClick={onRedo} disabled={!canRedo} aria-label="Rehacer">
          ↪︎
        </button>
        <button className="icon-btn primary" onClick={onAddPage}>
          + Página
        </button>
      </div>

      <div className="toolbar-row toolbar-row-tools">
        <button
          ref={penButtonRef}
          className={`dock-btn ${isPenTool ? 'active' : ''}`}
          onClick={() => {
            setBrushLibraryOpen(true)
            setStylePopoverOpen(false)
          }}
        >
          <span className="dock-icon">{activePreset ? activePreset.icon : '✏️'}</span>
          <span className="dock-label">{activePreset ? activePreset.label : 'Pluma'}</span>
        </button>

        {isPenTool && (
          <button
            ref={styleButtonRef}
            className="dock-btn dock-btn-swatch"
            onClick={() => {
              setStylePopoverOpen((v) => !v)
              setBrushLibraryOpen(false)
            }}
            aria-label="Color y grosor"
          >
            <span className="swatch-preview" style={{ background: color }} />
          </button>
        )}

        <button
          className={`dock-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => {
            onToolChange('eraser')
            closePopovers()
          }}
        >
          <span className="dock-icon">🧽</span>
          <span className="dock-label">Borrador</span>
        </button>
        <button
          className={`dock-btn ${tool === 'select' ? 'active' : ''}`}
          onClick={() => {
            onToolChange('select')
            closePopovers()
          }}
        >
          <span className="dock-icon">👆</span>
          <span className="dock-label">Seleccionar</span>
        </button>
        <button className="dock-btn" onClick={onOpenText}>
          <span className="dock-icon">🅰️</span>
          <span className="dock-label">Texto</span>
        </button>
        <button
          ref={stickerButtonRef}
          className="dock-btn"
          onClick={() => setStickerPopoverOpen((v) => !v)}
        >
          <span className="dock-icon">😊</span>
          <span className="dock-label">Stickers</span>
        </button>
      </div>

      {stickerPopoverOpen && (
        <Popover anchorRef={stickerButtonRef} onClose={() => setStickerPopoverOpen(false)}>
          <StickerPicker
            onPick={(emoji) => {
              onPickSticker(emoji)
              setStickerPopoverOpen(false)
            }}
            onClose={() => setStickerPopoverOpen(false)}
          />
        </Popover>
      )}

      {brushLibraryOpen && (
        <BrushLibrary
          tool={isPenTool ? (tool as PenType) : 'pencil'}
          color={color}
          onSelect={selectPen}
          onClose={() => setBrushLibraryOpen(false)}
        />
      )}

      {stylePopoverOpen && isPenTool && activePreset && (
        <Popover anchorRef={styleButtonRef} onClose={() => setStylePopoverOpen(false)}>
          <ColorPicker color={color} recentColors={recentColors} onChange={onColorChange} />
          <div className="width-slider-row">
            <span className="color-section-label">Tamaño</span>
            <input
              type="range"
              min={activePreset.minWidth}
              max={activePreset.maxWidth}
              step={0.5}
              value={width}
              onChange={(e) => onWidthChange(Number(e.target.value))}
            />
            <span className="width-value">{width.toFixed(1)}</span>
          </div>
          {activePreset.supportsStraightLine && (
            <label className="straight-toggle-row">
              <span>Línea recta</span>
              <input type="checkbox" checked={straight} onChange={onStraightToggle} />
            </label>
          )}
        </Popover>
      )}
    </header>
  )
}
