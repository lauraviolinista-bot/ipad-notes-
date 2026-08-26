const STICKER_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Básicos',
    emojis: ['⭐️', '❤️', '✅', '❌', '⚠️', '🔥', '💡', '📌', '📎', '🔖', '🎯', '🚩'],
  },
  {
    label: 'Estudio',
    emojis: ['📚', '📝', '✏️', '🖊️', '📐', '🧮', '🔬', '🧪', '💻', '🎓', '📅', '⏰'],
  },
  {
    label: 'Emociones',
    emojis: ['😀', '😅', '😍', '🤔', '😴', '🥳', '😭', '😡', '👍', '👎', '🙌', '👏'],
  },
  {
    label: 'Naturaleza',
    emojis: ['🌿', '🌸', '🌞', '🌙', '⭐️', '☁️', '🌈', '🍃', '🌵', '🍂', '🌊', '🦋'],
  },
  {
    label: 'Notas adhesivas',
    emojis: ['🗒️', '📋', '🧷', '🖇️', '📎', '🏷️', '📌', '🗂️', '📇', '🪧', '📝', '🔖'],
  },
  {
    label: 'Flechas y bocadillos',
    emojis: ['➡️', '↗️', '↩️', '↪️', '🔄', '➰', '💬', '💭', '❗', '❓', '✨', '💥'],
  },
  {
    label: 'Marcos y cintas',
    emojis: ['🎀', '🎗️', '🧵', '🪢', '🖼️', '🪪', '📮', '✉️', '📦', '🎫', '🏳️', '🪅'],
  },
  {
    label: 'Café y postres',
    emojis: ['☕', '🍵', '🧋', '🍰', '🧁', '🍪', '🍓', '🍌', '🥐', '🍩', '🍯', '🍫'],
  },
  {
    label: 'Playa y viaje',
    emojis: ['🏖️', '⛱️', '🧳', '✈️', '⛵', '🌴', '🗺️', '🧭', '📷', '🎒', '🚲', '🛶'],
  },
]

interface StickerPickerProps {
  onPick: (emoji: string) => void
  onClose: () => void
}

export default function StickerPicker({ onPick, onClose }: StickerPickerProps) {
  return (
    <div className="sticker-picker-content">
      <div className="sticker-picker-header">
        <span>Stickers</span>
        <button onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </div>
      {STICKER_CATEGORIES.map((cat) => (
        <div key={cat.label} className="sticker-category">
          <span className="color-section-label">{cat.label}</span>
          <div className="sticker-grid">
            {cat.emojis.map((e) => (
              <button key={e} className="sticker-item" onClick={() => onPick(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
