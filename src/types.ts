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
export type ShapeKind = 'line' | 'rectangle' | 'ellipse' | 'triangle'
export type Tool = PenType | 'eraser' | 'select' | 'shape'

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

export type FontFamily = 'sans' | 'serif' | 'mono' | 'handwritten'
export type TextAlign = 'left' | 'center' | 'right'

export type TextStyle = {
  fill: string | null
  border: string | null
  textColor: string
  fontFamily: FontFamily
  fontSize: number
  bold: boolean
  italic: boolean
  align: TextAlign
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

export type PageTemplate =
  | 'blank'
  | 'lined'
  | 'grid'
  | 'dotted'
  | 'music'
  | 'planner'
  | 'todo'
  | 'cornell'
  | 'calendar'

export interface Page {
  id: string
  strokes: Stroke[]
  elements: PageElement[]
  template: PageTemplate
  background: string | null // data URL — imported image or PDF page rendering
  ocrText: string // cached handwriting/background recognition, used for search
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
