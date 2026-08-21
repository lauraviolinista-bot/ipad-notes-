import { useState } from 'react'
import type { NotebookCover } from './types'
import { COVER_PRESETS } from './coverPresets'

interface NewNotebookModalProps {
  onCreate: (name: string, cover: NotebookCover) => void
  onClose: () => void
}

export default function NewNotebookModal({ onCreate, onClose }: NewNotebookModalProps) {
  const [name, setName] = useState('')
  const [cover, setCover] = useState<NotebookCover>(COVER_PRESETS[0])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nuevo cuaderno</h2>
        <input
          className="modal-input"
          placeholder="Nombre del cuaderno"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <span className="color-section-label">Portada</span>
        <div className="cover-grid">
          {COVER_PRESETS.map((c, i) => (
            <button
              key={i}
              className={`cover-swatch ${cover === c ? 'active' : ''}`}
              style={{ background: c.background }}
              onClick={() => setCover(c)}
            >
              <span
                className={`cover-swatch-accent cover-${c.pattern}`}
                style={{ background: c.accent }}
              />
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="icon-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="icon-btn primary"
            onClick={() => onCreate(name.trim() || 'Cuaderno sin título', cover)}
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  )
}
