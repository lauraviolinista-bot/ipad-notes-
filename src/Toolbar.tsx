import { useRef, useState } from 'react'
import type { LineCap, LineDash, PageTemplate, PenType, ShapeKind, Tool } from './types'
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
  color2?: string | null
  width: number
  straight: boolean
  lineDash: LineDash
  lineCap: LineCap
  pressureFactor: number
  snapToRuled: boolean
  pageTemplate: PageTemplate
  shapeKind: ShapeKind
  recentColors: string[]
  canUndo: boolean
  canRedo: boolean
  onToolChange: (t: Tool) => void
  onColorChange: (c: string) => void
  onColor2Change: (c: string | null) => void
  onWidthChange: (w: number) => void
  onStraightToggle: () => void
  onLineDashChange: (d: LineDash) => void
  onLineCapChange: (c: LineCap) => void
  onPressureFactorChange: (f: number) => void
  onSnapToRuledToggle: () => void
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
  onExportPageImage: () => void
  onExportNotebookPdf: () => void
  onSharePage: () => void
  canShare: boolean
  exportBusy: string | null
}

export default function Toolbar({
  notebookName,
  tool,
  color,
  color2,
  width,
  straight,
  lineDash,
  lineCap,
  pressureFactor,
  snapToRuled,
  pageTemplate,
  shapeKind,
  recentColors,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onColor2Change,
  onWidthChange,
  onStraightToggle,
  onLineDashChange,
  onLineCapChange,
  onPressureFactorChange,
  onSnapToRuledToggle,
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
  onExportPageImage,
  onExportNotebookPdf,
  onSharePage,
  canShare,
  exportBusy,
}: ToolbarProps) {
  const [brushLibraryOpen, setBrushLibraryOpen] = useState(false)
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false)
  const [stickerPopoverOpen, setStickerPopoverOpen] = useState(false)
  const [shapePopoverOpen, setShapePopoverOpen] = useState(false)
  const [importPopoverOpen, setImportPopoverOpen] = useState(false)
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false)
  const penButtonRef = useRef<HTMLButtonElement>(null)
  const styleButtonRef = useRef<HTMLButtonElement>(null)
  const stickerButtonRef = useRef<HTMLButtonElement>(null)
  const shapeButtonRef = useRef<HTMLButtonElement>(null)
  const importButtonRef = useRef<HTMLButtonElement>(null)
  const exportButtonRef = useRef<HTMLButtonElement>(null)
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
        <button
          ref={exportButtonRef}
          className="icon-btn"
          onClick={() => setExportPopoverOpen((v) => !v)}
          disabled={exportBusy !== null}
        >
          {exportBusy ?? '📤 Exportar'}
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
            <span
              className="swatch-preview"
              style={{ background: color2 ? `linear-gradient(135deg, ${color}, ${color2})` : color }}
            />
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

      {exportPopoverOpen && (
        <Popover anchorRef={exportButtonRef} onClose={() => setExportPopoverOpen(false)}>
          <div className="import-menu">
            <span className="color-section-label">Exportar / compartir</span>
            <button
              className="import-menu-item"
              onClick={() => {
                onExportPageImage()
                setExportPopoverOpen(false)
              }}
            >
              🖼️ Página actual como imagen
            </button>
            <button
              className="import-menu-item"
              onClick={() => {
                onExportNotebookPdf()
                setExportPopoverOpen(false)
              }}
            >
              📄 Cuaderno completo como PDF
            </button>
            {canShare && (
              <button
                className="import-menu-item"
                onClick={() => {
                  onSharePage()
                  setExportPopoverOpen(false)
                }}
              >
                📤 Compartir página actual
              </button>
            )}
          </div>
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

      {stylePopoverOpen && showsStyle && (
        <Popover
          anchorRef={styleButtonRef}
          onClose={() => setStylePopoverOpen(false)}
          className="popover-wide"
        >
          <ColorPicker
            color={color}
            color2={color2}
            recentColors={recentColors}
            onChange={onColorChange}
            onColor2Change={onColor2Change}
          />
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

          {isPenTool && (
            <>
              <div className="line-style-row">
                <span className="color-section-label">Estilo de línea</span>
                <div className="segmented">
                  <button
                    className={`segmented-btn ${lineDash === 'solid' ? 'active' : ''}`}
                    onClick={() => onLineDashChange('solid')}
                    aria-label="Línea continua"
                  >
                    ───
                  </button>
                  <button
                    className={`segmented-btn ${lineDash === 'dashed' ? 'active' : ''}`}
                    onClick={() => onLineDashChange('dashed')}
                    aria-label="Línea discontinua"
                  >
                    ╌╌╌
                  </button>
                  <button
                    className={`segmented-btn ${lineDash === 'dotted' ? 'active' : ''}`}
                    onClick={() => onLineDashChange('dotted')}
                    aria-label="Línea punteada"
                  >
                    ⋯⋯
                  </button>
                </div>
              </div>

              <div className="line-style-row">
                <span className="color-section-label">Puntas</span>
                <div className="segmented">
                  <button
                    className={`segmented-btn ${lineCap === 'round' ? 'active' : ''}`}
                    onClick={() => onLineCapChange('round')}
                    aria-label="Puntas redondeadas"
                  >
                    ● Redonda
                  </button>
                  <button
                    className={`segmented-btn ${lineCap === 'square' ? 'active' : ''}`}
                    onClick={() => onLineCapChange('square')}
                    aria-label="Puntas cuadradas"
                  >
                    ▪ Cuadrada
                  </button>
                  <button
                    className={`segmented-btn ${lineCap === 'butt' ? 'active' : ''}`}
                    onClick={() => onLineCapChange('butt')}
                    aria-label="Puntas rectas"
                  >
                    ▮ Recta
                  </button>
                </div>
              </div>

              {activePreset?.pressureSensitive && (
                <div className="width-slider-row">
                  <span className="color-section-label">Sensibilidad a la presión</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={pressureFactor}
                    onChange={(e) => onPressureFactorChange(Number(e.target.value))}
                  />
                  <span className="width-value">{Math.round(pressureFactor * 100)}%</span>
                </div>
              )}

              {pageTemplate === 'lined' && (
                <label className="straight-toggle-row">
                  <span>Ajustar al renglón</span>
                  <input type="checkbox" checked={snapToRuled} onChange={onSnapToRuledToggle} />
                </label>
              )}
            </>
          )}
        </Popover>
      )}
    </header>
  )
}
