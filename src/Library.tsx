import type { Notebook } from './types'

interface LibraryProps {
  notebooks: Notebook[]
  onOpen: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export default function Library({ notebooks, onOpen, onCreate, onDelete }: LibraryProps) {
  return (
    <div className="library">
      <header className="library-header">
        <h1>Mis Cuadernos</h1>
        <button className="icon-btn primary" onClick={onCreate}>
          + Nuevo cuaderno
        </button>
      </header>
      {notebooks.length === 0 ? (
        <p className="empty">Todavía no tienes cuadernos. Crea el primero.</p>
      ) : (
        <div className="notebook-grid">
          {notebooks
            .slice()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((nb) => (
              <div key={nb.id} className="notebook-card" onClick={() => onOpen(nb.id)}>
                <div className="notebook-cover">
                  <span>{nb.pages.length} pág.</span>
                </div>
                <div className="notebook-meta">
                  <span className="notebook-name">{nb.name}</span>
                  <button
                    className="delete-notebook"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(nb.id)
                    }}
                    aria-label={`Eliminar ${nb.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
