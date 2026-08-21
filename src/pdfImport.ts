import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MAX_DIMENSION = 1600

export async function importPdfFile(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pageImages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = MAX_DIMENSION / Math.max(baseViewport.width, baseViewport.height)
    const viewport = page.getViewport({ scale: Math.min(scale, 2) })

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({ canvasContext: ctx, viewport }).promise
    pageImages.push(canvas.toDataURL('image/jpeg', 0.85))
  }

  return pageImages
}
