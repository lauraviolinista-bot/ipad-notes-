import { useMemo, useState } from 'react'
import type { Notebook } from './types'

interface LibraryProps {
  notebooks: Notebook[]
  onOpen: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onSearch: () => void
  onToggleFavorite: (id: string) => void
  onSetFolder: (id: string, folder: string | null) => void
  onSetTags: (id: string, tags: string[]) => void
}

const UNFILED = '__sin_carpeta__'

export default function Library({
  notebooks,
  onOpen,
  onCreate,
  onDelete,
  onSearch,
  onToggleFavorite,
  onSetFolder,
  onSetTags,
}: LibraryProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)

  const folders = useMemo(() => {
    const set = new Set<string>()
    for (const nb of notebooks) if (nb.folder) set.add(nb.folder)
    return Array.from(set).sort()
  }, [notebooks])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const nb of notebooks) for (const t of nb.tags ?? []) set.add(t)
    return Array.from(set).sort()
  }, [notebooks])

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const filtered = notebooks
    .filter((nb) => {
      if (activeFilter === 'favorites') return !!nb.favorite
      if (activeFilter === UNFILED) return !nb.folder
      if (activeFilter !== 'all') return nb.folder === activeFilter
      return true
    })
    .filter((nb) => {
      if (activeTags.size === 0) return true
      const tags = nb.tags ?? []
      return Array.from(activeTags).every((t) => tags.includes(t))
    })
    .slice()
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt)

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

      {notebooks.length > 0 && (
        <>
          <div className="library-filter-row">
            <button
              className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Todos
            </button>
            <button
              className={`filter-chip ${activeFilter === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveFilter('favorites')}
            >
              ⭐ Favoritos
            </button>
            {folders.map((f) => (
              <button
                key={f}
                className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                📁 {f}
              </button>
            ))}
            <button
              className={`filter-chip ${activeFilter === UNFILED ? 'active' : ''}`}
              onClick={() => setActiveFilter(UNFILED)}
            >
              Sin carpeta
            </button>
          </div>
          {allTags.length > 0 && (
            <div className="library-filter-row library-tag-row">
              {allTags.map((t) => (
                <button
                  key={t}
                  className={`filter-chip tag-chip ${activeTags.has(t) ? 'active' : ''}`}
                  onClick={() => toggleTag(t)}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {notebooks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📓</span>
          <p className="empty-state-title">Todavía no tienes cuadernos</p>
          <p className="empty">Crea el primero y empieza a escribir.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p className="empty-state-title">Ningún cuaderno coincide con este filtro</p>
        </div>
      ) : (
        <div className="notebook-grid">
          {filtered.map((nb) => (
            <div key={nb.id} className="notebook-card" onClick={() => onOpen(nb.id)}>
              <div className="notebook-cover" style={{ background: nb.cover.background }}>
                {nb.cover.pattern === 'stripe' && (
                  <span className="cover-stripe" style={{ background: nb.cover.accent }} />
                )}
                {nb.cover.pattern === 'bottom-bar' && (
                  <span className="cover-bottom-bar" style={{ background: nb.cover.accent }} />
                )}
                <button
                  className={`favorite-toggle ${nb.favorite ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite(nb.id)
                  }}
                  aria-label={nb.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                >
                  {nb.favorite ? '⭐' : '☆'}
                </button>
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
                <div className="notebook-meta-actions">
                  <button
                    className="organize-toggle"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId((id) => (id === nb.id ? null : nb.id))
                    }}
                    aria-label="Organizar"
                  >
                    🏷️
                  </button>
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
              {(nb.folder || (nb.tags && nb.tags.length > 0)) && (
                <div className="notebook-tags">
                  {nb.folder && <span className="notebook-folder-chip">📁 {nb.folder}</span>}
                  {(nb.tags ?? []).map((t) => (
                    <span key={t} className="notebook-tag-chip">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {editingId === nb.id && (
                <div className="organize-panel" onClick={(e) => e.stopPropagation()}>
                  <label className="organize-field">
                    <span>Carpeta</span>
                    <input
                      type="text"
                      defaultValue={nb.folder ?? ''}
                      placeholder="Sin carpeta"
                      onBlur={(e) => onSetFolder(nb.id, e.target.value.trim() || null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      }}
                    />
                  </label>
                  <label className="organize-field">
                    <span>Etiquetas (separadas por coma)</span>
                    <input
                      type="text"
                      defaultValue={(nb.tags ?? []).join(', ')}
                      placeholder="trabajo, ideas…"
                      onBlur={(e) =>
                        onSetTags(
                          nb.id,
                          e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean),
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
