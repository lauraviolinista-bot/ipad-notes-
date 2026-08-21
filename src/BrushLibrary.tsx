import { useState } from 'react'
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="brush-library" onClick={(e) => e.stopPropagation()}>
        <div className="brush-library-preview">
          <BrushThumbnail tool={tool} color={color} width={280} height={64} />
        </div>
        <div className="brush-library-body">
          <nav className="brush-category-list">
            {PEN_CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`brush-category-item ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </nav>
          <div className="brush-grid">
            {brushesInCategory.map((p) => (
              <button
                key={p.id}
                className={`brush-card ${tool === p.id ? 'active' : ''}`}
                onClick={() => {
                  onSelect(p.id)
                  onClose()
                }}
              >
                <BrushThumbnail tool={p.id} color={color} width={180} height={36} />
                <div className="brush-card-meta">
                  <span className="brush-card-name">
                    {p.icon} {p.label}
                  </span>
                  <span className="brush-card-desc">{p.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
