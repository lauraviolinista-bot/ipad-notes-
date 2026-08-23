import type { Notebook } from './types'

interface LibraryProps {
  notebooks: Notebook[]
  onOpen: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onSearch: () => void
}

export default function Library({ notebooks, onOpen, onCreate, onDelete, onSearch }: LibraryProps) {
  return (
    <div className="library">
      <header className="library-header">
        <div>
          <h1>Mis Cuadernos</h1>
          <p className="library-subtitle">
            {notebooks.length > 0
              ? `${notebooks.length} ${notebooks.length === 1 ? 'cuaderno' : 'cuadernos'}`
              : 'Tu espacio de notas'}
          </p>
        </div>
        <div className="library-header-actions">
          <button className="icon-btn" onClick={onSearch} aria-label="Buscar">
            🔍 Buscar
          </button>
          <button className="icon-btn primary" onClick={onCreate}>
            + Nuevo cuaderno
          </button>
        </div>
      </header>
      {notebooks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📓</span>
          <p className="empty-state-title">Todavía no tienes cuadernos</p>
          <p className="empty">Crea el primero y empieza a escribir.</p>
        </div>
      ) : (
        <div className="notebook-grid">
          {notebooks
            .slice()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((nb) => (
              <div key={nb.id} className="notebook-card" onClick={() => onOpen(nb.id)}>
                <div className="notebook-cover" style={{ background: nb.cover.background }}>
                  {nb.cover.pattern === 'stripe' && (
                    <span className="cover-stripe" style={{ background: nb.cover.accent }} />
                  )}
                  {nb.cover.pattern === 'bottom-bar' && (
                    <span className="cover-bottom-bar" style={{ background: nb.cover.accent }} />
                  )}
                  <span
                    className="notebook-page-count"
                    style={{
                      color:
                        nb.cover.background === '#1c1c1e'
                          ? 'rgba(255,255,255,0.7)'
                          : 'rgba(0,0,0,0.45)',
                    }}
                  >
                    {nb.pages.length} pág.
                  </span>
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
