import { useRef, useState } from 'react'
import type { PenType, ShapeKind, Tool } from './types'
import { getPenPreset } from './penTypes'
import { SHAPE_PRESETS, SHAPE_WIDTH_RANGE } from './shapes'
import ColorPicker from './ColorPicker'
import BrushLibrary from './BrushLibrary'
import Popover from './Popover'
import StickerPicker from './StickerPicker'
import ShapePicker from './ShapePicker'

interface ToolbarProps {
  notebookName: string
  tool: Tool
  color: string
  width: number
  straight: boolean
  shapeKind: ShapeKind
  recentColors: string[]
  canUndo: boolean
  canRedo: boolean
  onToolChange: (t: Tool) => void
  onColorChange: (c: string) => void
  onWidthChange: (w: number) => void
  onStraightToggle: () => void
  onShapeKindChange: (k: ShapeKind) => void
  onUndo: () => void
  onRedo: () => void
  onAddPage: () => void
  onBack: () => void
  onOpenText: () => void
  onPickSticker: (emoji: string) => void
  onImportImage: (file: File) => void
  onImportPdf: (file: File) => void
  importBusy: string | null
  onIndexNotebook: () => void
  indexingStatus: string | null
}

export default function Toolbar({
  notebookName,
  tool,
  color,
  width,
  straight,
  shapeKind,
  recentColors,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onWidthChange,
  onStraightToggle,
  onShapeKindChange,
  onUndo,
  onRedo,
  onAddPage,
  onBack,
  onOpenText,
  onPickSticker,
  onImportImage,
  onImportPdf,
  importBusy,
  onIndexNotebook,
  indexingStatus,
}: ToolbarProps) {
  const [brushLibraryOpen, setBrushLibraryOpen] = useState(false)
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false)
  const [stickerPopoverOpen, setStickerPopoverOpen] = useState(false)
  const [shapePopoverOpen, setShapePopoverOpen] = useState(false)
  const [importPopoverOpen, setImportPopoverOpen] = useState(false)
  const penButtonRef = useRef<HTMLButtonElement>(null)
  const styleButtonRef = useRef<HTMLButtonElement>(null)
  const stickerButtonRef = useRef<HTMLButtonElement>(null)
  const shapeButtonRef = useRef<HTMLButtonElement>(null)
  const importButtonRef = useRef<HTMLButtonElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const isPenTool = tool !== 'eraser' && tool !== 'select' && tool !== 'shape'
  const isShapeTool = tool === 'shape'
  const showsStyle = isPenTool || isShapeTool
  const activePreset = isPenTool ? getPenPreset(tool as PenType) : null
  const activeShapePreset = SHAPE_PRESETS.find((s) => s.id === shapeKind)!
  const widthRange = isShapeTool
    ? SHAPE_WIDTH_RANGE
    : activePreset
      ? { min: activePreset.minWidth, max: activePreset.maxWidth }
      : { min: 1, max: 20 }

  const selectPen = (id: PenType) => {
    onToolChange(id)
    const preset = getPenPreset(id)
    onWidthChange(preset.defaultWidth)
    setStylePopoverOpen(true)
  }

  const closePopovers = () => {
    setBrushLibraryOpen(false)
    setStylePopoverOpen(false)
    setShapePopoverOpen(false)
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
        <button
          className="icon-btn"
          onClick={onIndexNotebook}
          disabled={indexingStatus !== null}
          title="Indexar el cuaderno para poder buscar el texto manuscrito"
        >
          {indexingStatus ?? '🔤 Indexar'}
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
            setShapePopoverOpen(false)
          }}
        >
          <span className="dock-icon">{activePreset ? activePreset.icon : '✏️'}</span>
          <span className="dock-label">{activePreset ? activePreset.label : 'Pluma'}</span>
        </button>

        <button
          ref={shapeButtonRef}
          className={`dock-btn ${isShapeTool ? 'active' : ''}`}
          onClick={() => {
            if (isShapeTool) {
              setShapePopoverOpen((v) => !v)
            } else {
              onToolChange('shape')
              setShapePopoverOpen(true)
            }
            setBrushLibraryOpen(false)
            setStylePopoverOpen(false)
          }}
        >
          <span className="dock-icon">{activeShapePreset.icon}</span>
          <span className="dock-label">Formas</span>
        </button>

        {showsStyle && (
          <button
            ref={styleButtonRef}
            className="dock-btn dock-btn-swatch"
            onClick={() => {
              setStylePopoverOpen((v) => !v)
              setBrushLibraryOpen(false)
              setShapePopoverOpen(false)
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
        <button
          ref={importButtonRef}
          className="dock-btn"
          onClick={() => setImportPopoverOpen((v) => !v)}
          disabled={importBusy !== null}
        >
          <span className="dock-icon">{importBusy ? '⏳' : '🖼️'}</span>
          <span className="dock-label">{importBusy ?? 'Fondo'}</span>
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

      {shapePopoverOpen && (
        <Popover anchorRef={shapeButtonRef} onClose={() => setShapePopoverOpen(false)}>
          <ShapePicker
            shapeKind={shapeKind}
            onPick={(kind) => {
              onShapeKindChange(kind)
              setShapePopoverOpen(false)
            }}
          />
        </Popover>
      )}

      {importPopoverOpen && (
        <Popover anchorRef={importButtonRef} onClose={() => setImportPopoverOpen(false)}>
          <div className="import-menu">
            <span className="color-section-label">Fondo de página</span>
            <button
              className="import-menu-item"
              onClick={() => {
                imageInputRef.current?.click()
                setImportPopoverOpen(false)
              }}
            >
              🖼️ Imagen como fondo
            </button>
            <button
              className="import-menu-item"
              onClick={() => {
                pdfInputRef.current?.click()
                setImportPopoverOpen(false)
              }}
            >
              📄 Importar PDF (una página por hoja)
            </button>
          </div>
        </Popover>
      )}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImportImage(file)
          e.target.value = ''
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImportPdf(file)
          e.target.value = ''
        }}
      />

      {brushLibraryOpen && (
        <BrushLibrary
          tool={isPenTool ? (tool as PenType) : 'pencil'}
          color={color}
          onSelect={selectPen}
          onClose={() => setBrushLibraryOpen(false)}
        />
      )}

      {stylePopoverOpen && showsStyle && (
        <Popover anchorRef={styleButtonRef} onClose={() => setStylePopoverOpen(false)}>
          <ColorPicker color={color} recentColors={recentColors} onChange={onColorChange} />
          <div className="width-slider-row">
            <span className="color-section-label">Tamaño</span>
            <input
              type="range"
              min={widthRange.min}
              max={widthRange.max}
              step={0.5}
              value={width}
              onChange={(e) => onWidthChange(Number(e.target.value))}
            />
            <span className="width-value">{width.toFixed(1)}</span>
          </div>
          {activePreset?.supportsStraightLine && (
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
