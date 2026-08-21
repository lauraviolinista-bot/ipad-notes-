import { useState } from 'react'

const BASIC_COLORS = [
  '#000000', '#3a3a3c', '#5ac8fa', '#0a84ff', '#8e44ec', '#af52de',
  '#ff453a', '#ff6482', '#ff9f0a', '#ffd60a', '#34c759', '#30d5a8',
]

const GRADIENTS = [
  'linear-gradient(135deg,#5ac8fa,#0a84ff)',
  'linear-gradient(135deg,#ffd60a,#ff9f0a)',
  'linear-gradient(135deg,#af52de,#ff453a)',
  'linear-gradient(135deg,#ff453a,#8e44ec)',
  'linear-gradient(135deg,#34c759,#0a84ff)',
  'linear-gradient(135deg,#0a84ff,#5ac8fa)',
]

function gradientToSolid(gradient: string): string {
  const match = gradient.match(/#[0-9a-fA-F]{6}/)
  return match ? match[0] : '#000000'
}

interface ColorPickerProps {
  color: string
  recentColors: string[]
  onChange: (color: string) => void
}

export default function ColorPicker({ color, recentColors, onChange }: ColorPickerProps) {
  const [customOpen, setCustomOpen] = useState(false)

  return (
    <div className="color-picker">
      <div className="color-section">
        <span className="color-section-label">Básico</span>
        <div className="swatch-grid">
          {BASIC_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => onChange(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="color-section">
        <span className="color-section-label">Degradado</span>
        <div className="swatch-grid">
          {GRADIENTS.map((g) => (
            <button
              key={g}
              className="swatch"
              style={{ background: g }}
              onClick={() => onChange(gradientToSolid(g))}
              aria-label="Color degradado"
            />
          ))}
        </div>
      </div>

      {recentColors.length > 0 && (
        <div className="color-section">
          <span className="color-section-label">Recientes</span>
          <div className="swatch-grid">
            {recentColors.map((c, i) => (
              <button
                key={c + i}
                className={`swatch ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => onChange(c)}
                aria-label={`Color reciente ${c}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="color-section">
        <button className="custom-color-toggle" onClick={() => setCustomOpen((v) => !v)}>
          Color personalizado
        </button>
        {customOpen && (
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="custom-color-input"
          />
        )}
      </div>
    </div>
  )
}
