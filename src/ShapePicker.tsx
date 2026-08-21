import type { ShapeKind } from './types'
import { SHAPE_PRESETS } from './shapes'

interface ShapePickerProps {
  shapeKind: ShapeKind
  onPick: (kind: ShapeKind) => void
}

export default function ShapePicker({ shapeKind, onPick }: ShapePickerProps) {
  return (
    <div className="shape-picker">
      <span className="color-section-label">Formas asistidas</span>
      <div className="shape-grid">
        {SHAPE_PRESETS.map((s) => (
          <button
            key={s.id}
            className={`shape-item ${shapeKind === s.id ? 'active' : ''}`}
            onClick={() => onPick(s.id)}
          >
            <span className="shape-item-icon">{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <p className="shape-hint">Arrastra en la página para dibujar. Se endereza y ajusta solo.</p>
    </div>
  )
}
