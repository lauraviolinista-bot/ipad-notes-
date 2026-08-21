export type PenType =
  | 'pencil'
  | 'fountain'
  | 'brush'
  | 'fineliner'
  | 'highlighter'
  | 'marker'
  | 'calligraphy'
  | 'watercolor'
  | 'charcoal'
  | 'crosshatch'
  | 'stipple'
  | 'gridTexture'
  | 'brick'
export type Tool = PenType | 'eraser' | 'select'

export interface StrokePoint {
  x: number
  y: number
  pressure: number
}

export interface Stroke {
  id: string
  tool: PenType
  color: string
  width: number
  opacity: number
  straight: boolean
  points: StrokePoint[]
}

export type TextStyle = {
  fill: string | null
  border: string | null
  textColor: string
}

export interface TextElement {
  id: string
  type: 'text'
  x: number
  y: number
  w: number
  h: number
  text: string
  style: TextStyle
}

export interface StickerElement {
  id: string
  type: 'sticker'
  x: number
  y: number
  size: number
  emoji: string
}

export type PageElement = TextElement | StickerElement

export type PageTemplate = 'blank' | 'lined' | 'grid' | 'dotted' | 'music' | 'planner'

export interface Page {
  id: string
  strokes: Stroke[]
  elements: PageElement[]
  template: PageTemplate
}

export interface NotebookCover {
  background: string
  accent: string
  pattern: 'plain' | 'stripe' | 'bottom-bar'
}

export interface Notebook {
  id: string
  name: string
  pages: Page[]
  updatedAt: number
  cover: NotebookCover
}
