import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  children: ReactNode
  className?: string
}

export default function Popover({ anchorRef, onClose, children, className = '' }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const popover = popoverRef.current
    if (!anchor || !popover) return

    const place = () => {
      const anchorRect = anchor.getBoundingClientRect()
      const popRect = popover.getBoundingClientRect()
      const margin = 8
      let left = anchorRect.left
      let top = anchorRect.bottom + 6

      if (left + popRect.width > window.innerWidth - margin) {
        left = window.innerWidth - popRect.width - margin
      }
      if (left < margin) left = margin
      if (top + popRect.height > window.innerHeight - margin) {
        top = anchorRect.top - popRect.height - 6
      }
      if (top < margin) top = margin

      setPos({ top, left })
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchorRef])

  useLayoutEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      const popover = popoverRef.current
      const anchor = anchorRef.current
      const target = e.target as Node
      if (popover?.contains(target) || anchor?.contains(target)) return
      onClose()
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={popoverRef}
      className={`popover ${className}`}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
