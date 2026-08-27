import { useRef } from 'react'

export interface RulerTransform {
  cx: number
  cy: number
  angle: number // radians
}

interface RulerProps {
  transform: RulerTransform
  onChange: (t: RulerTransform) => void
}

const LENGTH = 340
const THICKNESS = 64

// A draggable, rotatable straight-edge overlay — drag the body to move it,
// drag the small handle at either end to rotate it around its center. Canvas
// reads its angle to force pen strokes straight along that edge, like resting
// a real ruler on the page.
export default function Ruler({ transform, onChange }: RulerProps) {
  const dragRef = useRef<{ pointerId: number; mode: 'move' | 'rotate'; startX: number; startY: number; start: RulerTransform } | null>(null)

  const handleBodyPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { pointerId: e.pointerId, mode: 'move', startX: e.clientX, startY: e.clientY, start: transform }
  }

  const handleHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { pointerId: e.pointerId, mode: 'rotate', startX: e.clientX, startY: e.clientY, start: transform }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    if (drag.mode === 'move') {
      onChange({
        ...drag.start,
        cx: drag.start.cx + (e.clientX - drag.startX),
        cy: drag.start.cy + (e.clientY - drag.startY),
      })
    } else {
      const angle = Math.atan2(e.clientY - drag.start.cy, e.clientX - drag.start.cx)
      onChange({ ...drag.start, angle })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  const deg = (transform.angle * 180) / Math.PI
  const handleX = (LENGTH / 2) * Math.cos(transform.angle)
  const handleY = (LENGTH / 2) * Math.sin(transform.angle)

  return (
    <>
      <div
        className="ruler-bar"
        style={{
          left: transform.cx,
          top: transform.cy,
          width: LENGTH,
          height: THICKNESS,
          transform: `translate(-50%, -50%) rotate(${deg}deg)`,
        }}
        onPointerDown={handleBodyPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="ruler-edge" />
        <div className="ruler-ticks" />
      </div>
      <div
        className="ruler-rotate-handle"
        style={{ left: transform.cx + handleX, top: transform.cy + handleY }}
        onPointerDown={handleHandlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        ⟲
      </div>
    </>
  )
}
