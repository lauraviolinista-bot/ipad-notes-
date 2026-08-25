export type PenType =
  | 'pencil'
  | 'mechanicalPencil'
  | 'coloredPencil'
  | 'fountain'
  | 'brush'
  | 'inkBrush'
  | 'fineliner'
  | 'ballpoint'
  | 'gelPen'
  | 'highlighter'
  | 'neonHighlighter'
  | 'marker'
  | 'calligraphy'
  | 'watercolor'
  | 'charcoal'
  | 'pastel'
  | 'chalk'
  | 'crayon'
  | 'crosshatch'
  | 'stipple'
  | 'gridTexture'
  | 'brick'
  | 'glitter'
export type ShapeKind = 'line' | 'rectangle' | 'ellipse' | 'triangle'
export type Tool = PenType | 'eraser' | 'select' | 'shape'

export interface StrokePoint {
  x: number
  y: number
  pressure: number
}

export type LineDash = 'solid' | 'dashed' | 'dotted'
export type LineCap = 'round' | 'square' | 'butt'

export interface Stroke {
  id: string
  tool: PenType
  color: string
  color2?: string | null
  width: number
  opacity: number
  straight: boolean
  points: StrokePoint[]
  dash?: LineDash
  cap?: LineCap
  // 0 = width ignores pressure entirely, 1 = full pressure response (default).
  pressureFactor?: number
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
