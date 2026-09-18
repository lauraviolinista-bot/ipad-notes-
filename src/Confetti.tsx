import { useEffect, useMemo } from 'react'

const PIECES = ['🎉', '✨', '💕', '⭐️', '🎀', '🌸']

interface ConfettiProps {
  onDone: () => void
}

export default function Confetti({ onDone }: ConfettiProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 1700)
    return () => clearTimeout(t)
  }, [onDone])

  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.25,
        duration: 0.75 + Math.random() * 0.5,
        emoji: PIECES[Math.floor(Math.random() * PIECES.length)],
        drift: (Math.random() - 0.5) * 60,
        size: 16 + Math.random() * 14,
      })),
    [],
  )

  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}px`,
            // @ts-expect-error custom property for drift
            '--drift': `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
