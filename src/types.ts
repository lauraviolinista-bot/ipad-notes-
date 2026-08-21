export type Tool = 'pen' | 'highlighter' | 'eraser'

export interface StrokePoint {
  x: number
  y: number
  pressure: number
}

export interface Stroke {
  id: string
  tool: Tool
  color: string
  width: number
  opacity: number
  points: StrokePoint[]
}

export interface Page {
  id: string
  strokes: Stroke[]
}

export interface Notebook {
  id: string
  name: string
  pages: Page[]
  updatedAt: number
}
