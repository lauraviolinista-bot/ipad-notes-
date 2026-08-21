import type { Tool } from './types'

const COLORS = ['#1c1c1e', '#d0021b', '#0070f3', '#0a8f4c', '#f5a623']
const WIDTHS = [2, 4, 8]

interface ToolbarProps {
  notebookName: string
  tool: Tool
  color: string
  width: number
  canUndo: boolean
  canRedo: boolean
  onToolChange: (t: Tool) => void
  onColorChange: (c: string) => void
  onWidthChange: (w: number) => void
  onUndo: () => void
  onRedo: () => void
  onAddPage: () => void
  onBack: () => void
}

export default function Toolbar({
  notebookName,
  tool,
  color,
  width,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onWidthChange,
  onUndo,
  onRedo,
  onAddPage,
  onBack,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <button className="icon-btn" onClick={onBack} aria-label="Volver a notebooks">
        ‹
      </button>
      <span className="notebook-title">{notebookName}</span>

      <div className="group">
        <button
          className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => onToolChange('pen')}
        >
          ✏️ Lápiz
        </button>
        <button
          className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
          onClick={() => onToolChange('highlighter')}
        >
          🖍️ Resaltador
        </button>
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => onToolChange('eraser')}
        >
          🧽 Borrador
        </button>
      </div>

      {tool !== 'eraser' && (
        <div className="group">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => onColorChange(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      )}

      <div className="group">
        {WIDTHS.map((w) => (
          <button
            key={w}
            className={`width-btn ${width === w ? 'active' : ''}`}
            onClick={() => onWidthChange(w)}
            aria-label={`Grosor ${w}`}
          >
            <span className="dot" style={{ width: w + 4, height: w + 4 }} />
          </button>
        ))}
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
