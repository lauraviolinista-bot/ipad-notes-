import { createWorker, type Worker } from 'tesseract.js'
import type { Stroke } from './types'
import { drawStroke } from './strokeRenderer'
import { strokesBBox } from './geometry'

let workerPromise: Promise<Worker> | null = null

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('spa+eng')
  }
  return workerPromise
}

export async function recognizeDataURL(dataUrl: string): Promise<string> {
  const worker = await getWorker()
  const {
    data: { text },
  } = await worker.recognize(dataUrl)
  return text.trim()
}

const PADDING = 24

/** Renders a set of strokes to a standalone white-background image for OCR. */
export function strokesToDataURL(strokes: Stroke[]): string | null {
  const box = strokesBBox(strokes)
  if (!box) return null
  const width = Math.ceil(box.maxX - box.minX) + PADDING * 2
  const height = Math.ceil(box.maxY - box.minY) + PADDING * 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.translate(PADDING - box.minX, PADDING - box.minY)
  for (const stroke of strokes) drawStroke(ctx, stroke)
  return canvas.toDataURL('image/png')
}

/** Renders an entire page (background image + all strokes) for search indexing. */
export function pageToDataURL(
  strokes: Stroke[],
  background: string | null,
  pageWidth: number,
  pageHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = pageWidth
    canvas.height = pageHeight
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageWidth, pageHeight)

    const drawStrokesAndResolve = () => {
      for (const stroke of strokes) drawStroke(ctx, stroke)
      resolve(canvas.toDataURL('image/png'))
    }

    if (background) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, pageWidth, pageHeight)
        drawStrokesAndResolve()
      }
      img.onerror = drawStrokesAndResolve
      img.src = background
    } else {
      drawStrokesAndResolve()
    }
  })
}
