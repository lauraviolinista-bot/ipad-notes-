import { useState } from 'react'
import type { TextElement, TextStyle } from './types'
import { FONT_PRESETS } from './fonts'
import { POST_IT_PRESETS, TEXT_STYLE_PRESETS } from './PageElements'

interface TextFormatBarProps {
  left: number
  top: number
  element: TextElement
  onChangeStyle: (style: Partial<TextStyle>) => void
  onDelete: () => void
}

export default function TextFormatBar({
  left,
  top,
  element,
  onChangeStyle,
  onDelete,
}: TextFormatBarProps) {
  const { style } = element
  const [styleOpen, setStyleOpen] = useState(false)

  const applyPreset = (preset: TextStyle) => {
    onChangeStyle({ fill: preset.fill, border: preset.border, textColor: preset.textColor })
  }

  return (
    <div
      className="text-format-bar"
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="text-format-row">
        <select
          className="text-format-font"
          value={style.fontFamily}
          onChange={(e) => onChangeStyle({ fontFamily: e.target.value as TextStyle['fontFamily'] })}
        >
          {FONT_PRESETS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        <button
          className={`text-format-btn ${style.bold ? 'active' : ''}`}
          onClick={() => onChangeStyle({ bold: !style.bold })}
          aria-label="Negrita"
        >
          <b>B</b>
        </button>
        <button
          className={`text-format-btn ${style.italic ? 'active' : ''}`}
          onClick={() => onChangeStyle({ italic: !style.italic })}
          aria-label="Cursiva"
        >
          <i>I</i>
        </button>

        <div className="text-format-divider" />

        <button
          className={`text-format-btn ${style.align === 'left' ? 'active' : ''}`}
          onClick={() => onChangeStyle({ align: 'left' })}
          aria-label="Alinear a la izquierda"
        >
          ⯇
        </button>
        <button
          className={`text-format-btn ${style.align === 'center' ? 'active' : ''}`}
          onClick={() => onChangeStyle({ align: 'center' })}
          aria-label="Centrar"
        >
          ☰
        </button>
        <button
          className={`text-format-btn ${style.align === 'right' ? 'active' : ''}`}
          onClick={() => onChangeStyle({ align: 'right' })}
          aria-label="Alinear a la derecha"
        >
          ⯈
        </button>

        <div className="text-format-divider" />

        <input
          className="text-format-size"
          type="range"
          min={10}
          max={48}
          step={1}
          value={style.fontSize}
          onChange={(e) => onChangeStyle({ fontSize: Number(e.target.value) })}
          aria-label="Tamaño de letra"
        />

        <button
          className={`text-format-btn ${styleOpen ? 'active' : ''}`}
          onClick={() => setStyleOpen((v) => !v)}
          aria-label="Estilo de nota"
        >
          🎨
        </button>
        <button className="text-format-btn text-format-delete" onClick={onDelete} aria-label="Eliminar">
          🗑️
        </button>
      </div>

      {styleOpen && (
        <div className="text-style-panel">
          <span className="color-section-label">Estilo</span>
          <div className="text-style-swatch-row">
            {TEXT_STYLE_PRESETS.map((p, i) => (
              <button
                key={i}
                className="text-style-swatch"
                style={{
                  background: p.fill ?? 'white',
                  border: p.border ? `2px solid ${p.border}` : '2px solid var(--line)',
                }}
                onClick={() => applyPreset(p)}
                aria-label={`Estilo ${i + 1}`}
              />
            ))}
          </div>
          <span className="color-section-label">Post-it</span>
          <div className="text-style-swatch-row">
            {POST_IT_PRESETS.map((p, i) => (
              <button
                key={i}
                className="text-style-swatch post-it-swatch"
                style={{ background: p.fill ?? 'white' }}
                onClick={() => applyPreset(p)}
                aria-label={`Post-it ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
