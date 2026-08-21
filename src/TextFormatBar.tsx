import type { TextElement, TextStyle } from './types'
import { FONT_PRESETS } from './fonts'

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

  return (
    <div
      className="text-format-bar"
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
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

      <button className="text-format-btn text-format-delete" onClick={onDelete} aria-label="Eliminar">
        🗑️
      </button>
    </div>
  )
}
