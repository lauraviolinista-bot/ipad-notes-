import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { PenType } from './types'
import { PEN_CATEGORIES, PEN_PRESETS, getPenPreset, type PenCategory } from './penTypes'
import BrushThumbnail from './BrushThumbnail'

interface BrushLibraryProps {
  tool: PenType
  color: string
  onSelect: (id: PenType) => void
  onClose: () => void
}

export default function BrushLibrary({ tool, color, onSelect, onClose }: BrushLibraryProps) {
  const activePreset = getPenPreset(tool)
  const [category, setCategory] = useState<PenCategory>(activePreset.category)

  const brushesInCategory = PEN_PRESETS.filter((p) => p.category === category)
  const activeBrush = PEN_PRESETS.find((p) => p.id === tool) ?? activePreset

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="brush-library" onClick={(e) => e.stopPropagation()}>
        <div className="brush-library-preview">
          <BrushThumbnail tool={tool} color={color} width={280} height={64} />
          <span className="brush-library-preview-name">{activeBrush.label}</span>
        </div>

        <nav className="brush-tabs">
          {PEN_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`brush-tab ${category === c.id ? 'active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <div className="brush-swatch-grid">
          {brushesInCategory.map((p) => (
            <button
              key={p.id}
              className={`brush-swatch-card ${tool === p.id ? 'active' : ''}`}
              onClick={() => {
                onSelect(p.id)
                onClose()
              }}
            >
              <span className="brush-swatch-icon">{p.icon}</span>
              <span className="brush-swatch-label">{p.label}</span>
            </button>
          ))}
        </div>

        <p className="brush-swatch-desc">{activeBrush.description}</p>
      </div>
    </div>,
    document.body,
  )
}
