import { useMemo, useState } from 'react'
import type { Notebook } from './types'

interface SearchResult {
  notebookId: string
  notebookName: string
  pageIndex: number
  snippet: string
}

interface SearchModalProps {
  notebooks: Notebook[]
  onClose: () => void
  onOpenResult: (notebookId: string, pageIndex: number) => void
}

function snippetAround(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, 80)
  const start = Math.max(0, idx - 30)
  const end = Math.min(text.length, idx + query.length + 30)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

export default function SearchModal({ notebooks, onClose, onOpenResult }: SearchModalProps) {
  const [query, setQuery] = useState('')

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const found: SearchResult[] = []

    for (const nb of notebooks) {
      if (nb.name.toLowerCase().includes(q)) {
        found.push({ notebookId: nb.id, notebookName: nb.name, pageIndex: 0, snippet: 'Nombre del cuaderno' })
      }
      nb.pages.forEach((page, i) => {
        if (page.ocrText && page.ocrText.toLowerCase().includes(q)) {
          found.push({
            notebookId: nb.id,
            notebookName: nb.name,
            pageIndex: i,
            snippet: snippetAround(page.ocrText, q),
          })
        }
        for (const el of page.elements) {
          if (el.type === 'text' && el.text.toLowerCase().includes(q)) {
            found.push({
              notebookId: nb.id,
              notebookName: nb.name,
              pageIndex: i,
              snippet: snippetAround(el.text, q),
            })
          }
        }
      })
    }
    return found.slice(0, 50)
  }, [query, notebooks])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Buscar en tus notas</h2>
        <input
          className="modal-input"
          placeholder="Buscar texto, incluido el manuscrito indexado…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query.trim().length >= 2 && results.length === 0 && (
          <p className="empty">
            Sin resultados. El texto manuscrito solo aparece en páginas ya indexadas (botón 🔤
            Indexar dentro del cuaderno).
          </p>
        )}
        <div className="search-results">
          {results.map((r, i) => (
            <button
              key={i}
              className="search-result-item"
              onClick={() => {
                onOpenResult(r.notebookId, r.pageIndex)
                onClose()
              }}
            >
              <span className="search-result-title">{r.notebookName}</span>
              <span className="search-result-snippet">
                Pág. {r.pageIndex + 1} — {r.snippet}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
