import { useState } from 'react'

// Grayscale ramp: white to black (same column count as the hue grid below, for alignment).
const GRAY_ROW = Array.from({ length: 12 }, (_, i) => {
  const l = Math.round(100 - (i / 11) * 100)
  return `hsl(0 0% ${l}%)`
})

// Spectrum grid: columns cycle through hues, rows go from light tints to dark shades —
// mirrors the "Cuadrícula" color sheet look from Notability/GoodNotes.
const HUES = Array.from({ length: 12 }, (_, i) => (190 + i * 30) % 360)
const ROWS = [88, 74, 60, 46, 32, 18]
const SPECTRUM_GRID = ROWS.map((l) => HUES.map((h) => `hsl(${h} 72% ${l}%)`))

const RECENT_MAX = 8

interface ColorPickerProps {
  color: string
  color2?: string | null
  recentColors: string[]
  onChange: (color: string) => void
  onColor2Change?: (color: string | null) => void
}

function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+) (\d+)% (\d+)%\)/)
  if (!match) return '#000000'
  const h = Number(match[1]) / 360
  const s = Number(match[2]) / 100
  const l = Number(match[3]) / 100
  if (s === 0) {
    const v = Math.round(l * 255)
    return `#${[v, v, v].map((x) => x.toString(16).padStart(2, '0')).join('')}`
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const r = Math.round(hue2rgb(h + 1 / 3) * 255)
  const g = Math.round(hue2rgb(h) * 255)
  const b = Math.round(hue2rgb(h - 1 / 3) * 255)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

export default function ColorPicker({ color, color2, recentColors, onChange, onColor2Change }: ColorPickerProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const duoActive = color2 != null
  // Which slot the spectrum grid writes into when duo mode is on.
  const [duoSlot, setDuoSlot] = useState<1 | 2>(1)

  const pick = (hslOrHex: string) => {
    const hex = hslOrHex.startsWith('hsl') ? hslToHex(hslOrHex) : hslOrHex
    if (duoActive && duoSlot === 2) {
      onColor2Change?.(hex)
    } else {
      onChange(hex)
    }
  }

  const toggleDuo = () => {
    if (!onColor2Change) return
    if (duoActive) {
      onColor2Change(null)
    } else {
      onColor2Change(color === '#ffffff' ? '#6d5ef1' : '#ffffff')
      setDuoSlot(2)
    }
  }

  const activeColorForCell = (hex: string) => {
    if (duoActive) {
      return duoSlot === 2 ? color2!.toLowerCase() === hex.toLowerCase() : color.toLowerCase() === hex.toLowerCase()
    }
    return color.toLowerCase() === hex.toLowerCase()
  }

  return (
    <div className="color-picker">
      {onColor2Change && (
        <div className="color-section duo-toggle-row">
          <button className={`duo-toggle ${duoActive ? 'active' : ''}`} onClick={toggleDuo}>
            🌈 Color dúo
          </button>
          {duoActive && (
            <div className="duo-slots">
              <button
                className={`duo-slot ${duoSlot === 1 ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => setDuoSlot(1)}
                aria-label="Color 1"
              />
              <button
                className={`duo-slot ${duoSlot === 2 ? 'active' : ''}`}
                style={{ background: color2 ?? '#ffffff' }}
                onClick={() => setDuoSlot(2)}
                aria-label="Color 2"
              />
            </div>
          )}
        </div>
      )}

      <div className="spectrum-sheet">
        <div className="spectrum-row">
          {GRAY_ROW.map((c) => (
            <button
              key={c}
              className="spectrum-cell"
              style={{ background: c }}
              onClick={() => pick(c)}
              aria-label={`Gris ${c}`}
            >
              {activeColorForCell(hslToHex(c)) && <span className="spectrum-check" />}
            </button>
          ))}
        </div>
        {SPECTRUM_GRID.map((row, ri) => (
          <div className="spectrum-row" key={ri}>
            {row.map((c, ci) => (
              <button
                key={ci}
                className="spectrum-cell"
                style={{ background: c }}
                onClick={() => pick(c)}
                aria-label={`Color ${c}`}
              >
                {activeColorForCell(hslToHex(c)) && <span className="spectrum-check" />}
              </button>
            ))}
          </div>
        ))}
      </div>

      {recentColors.length > 0 && (
        <div className="color-section">
          <span className="color-section-label">Recientes</span>
          <div className="swatch-grid">
            {recentColors.slice(0, RECENT_MAX).map((c, i) => (
              <button
                key={c + i}
                className={`swatch ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => pick(c)}
                aria-label={`Color reciente ${c}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="color-section">
        <button className="custom-color-toggle" onClick={() => setCustomOpen((v) => !v)}>
          🎨 Color personalizado
        </button>
        {customOpen && (
          <input
            type="color"
            value={duoActive && duoSlot === 2 ? (color2 ?? '#ffffff') : color}
            onChange={(e) => pick(e.target.value)}
            className="custom-color-input"
          />
        )}
      </div>
    </div>
  )
}
