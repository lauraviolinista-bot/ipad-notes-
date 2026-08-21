import type { Page } from './types'

interface PageStripProps {
  pages: Page[]
  activeIndex: number
  onSelect: (index: number) => void
  onDelete: (index: number) => void
}

export default function PageStrip({ pages, activeIndex, onSelect, onDelete }: PageStripProps) {
  return (
    <nav className="page-strip">
      {pages.map((page, i) => (
        <div key={page.id} className={`page-thumb ${i === activeIndex ? 'active' : ''}`}>
          <button onClick={() => onSelect(i)}>{i + 1}</button>
          {pages.length > 1 && (
            <button
              className="delete-page"
              onClick={() => onDelete(i)}
              aria-label={`Eliminar página ${i + 1}`}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}
