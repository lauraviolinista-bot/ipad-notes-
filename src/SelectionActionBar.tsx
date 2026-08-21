interface SelectionActionBarProps {
  left: number
  top: number
  recognizing: boolean
  onRecolor: (color: string) => void
  onDelete: () => void
  onRecognizeText: () => void
}

const QUICK_COLORS = ['#1c1c1e', '#d0021b', '#0a84ff', '#34c759', '#f5a623', '#af52de']

export default function SelectionActionBar({
  left,
  top,
  recognizing,
  onRecolor,
  onDelete,
  onRecognizeText,
}: SelectionActionBarProps) {
  return (
    <div className="selection-bar" style={{ left, top }}>
      {QUICK_COLORS.map((c) => (
        <button
          key={c}
          className="selection-bar-swatch"
          style={{ background: c }}
          onClick={() => onRecolor(c)}
          aria-label={`Recolorear a ${c}`}
        />
      ))}
      <button
        className="selection-bar-action"
        onClick={onRecognizeText}
        disabled={recognizing}
        aria-label="Reconocer como texto"
      >
        {recognizing ? '⏳' : '🔤'}
      </button>
      <button className="selection-bar-delete" onClick={onDelete} aria-label="Eliminar selección">
        🗑️
      </button>
    </div>
  )
}
