import { useState } from 'react'
import type { PenType, Tool } from './types'
import { PEN_PRESETS, getPenPreset } from './penTypes'
import ColorPicker from './ColorPicker'

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
  onOpenStickers: () => void
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
  onOpenStickers,
}: ToolbarProps) {
  const [penMenuOpen, setPenMenuOpen] = useState(false)
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false)

  const isPenTool = tool !== 'eraser' && tool !== 'select'
  const activePreset = isPenTool ? getPenPreset(tool as PenType) : null

  const selectPen = (id: PenType) => {
    onToolChange(id)
    const preset = getPenPreset(id)
    onWidthChange(preset.defaultWidth)
    setPenMenuOpen(false)
    setStylePopoverOpen(true)
  }

  return (
    <header className="toolbar">
      <button className="icon-btn" onClick={onBack} aria-label="Volver a notebooks">
        ‹
      </button>
      <span className="notebook-title">{notebookName}</span>

      <div className="group pen-selector">
        <button
          className={`tool-btn ${isPenTool ? 'active' : ''}`}
          onClick={() => {
            setPenMenuOpen((v) => !v)
            setStylePopoverOpen(false)
          }}
        >
          {activePreset ? `${activePreset.icon} ${activePreset.label}` : '✏️ Pluma'}
        </button>
        {penMenuOpen && (
          <div className="pen-menu">
            {PEN_PRESETS.map((p) => (
              <button
                key={p.id}
                className={`pen-menu-item ${tool === p.id ? 'active' : ''}`}
                onClick={() => selectPen(p.id)}
              >
                <span className="pen-icon">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        )}
        {isPenTool && (
          <button
            className="icon-btn style-toggle"
            onClick={() => {
              setStylePopoverOpen((v) => !v)
              setPenMenuOpen(false)
            }}
            aria-label="Color y grosor"
          >
            <span className="swatch-preview" style={{ background: color }} />
          </button>
        )}
        {stylePopoverOpen && isPenTool && activePreset && (
          <div className="style-popover">
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
          </div>
        )}
      </div>

      <div className="group">
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => {
            onToolChange('eraser')
            setPenMenuOpen(false)
            setStylePopoverOpen(false)
          }}
        >
          🧽 Borrador
        </button>
        <button
          className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
          onClick={() => {
            onToolChange('select')
            setPenMenuOpen(false)
            setStylePopoverOpen(false)
          }}
        >
          👆 Seleccionar
        </button>
      </div>

      <div className="group">
        <button className="tool-btn" onClick={onOpenText}>
          🅰️ Texto
        </button>
        <button className="tool-btn" onClick={onOpenStickers}>
          😊 Stickers
        </button>
      </div>

      <div className="group">
        <button className="icon-btn" onClick={onUndo} disabled={!canUndo} aria-label="Deshacer">
          ↩︎
        </button>
        <button className="icon-btn" onClick={onRedo} disabled={!canRedo} aria-label="Rehacer">
          ↪︎
        </button>
      </div>

      <button className="icon-btn primary" onClick={onAddPage}>
        + Página
      </button>
    </header>
  )
}
