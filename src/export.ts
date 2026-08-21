import type { Notebook, Page, PageElement } from './types'
import { drawStroke } from './strokeRenderer'
import { FONT_STACKS } from './fonts'

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ')
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    lines.push(current)
  }
  return lines
}

function drawTextElement(ctx: CanvasRenderingContext2D, el: Extract<PageElement, { type: 'text' }>) {
  if (el.style.fill) {
    ctx.fillStyle = el.style.fill
    ctx.fillRect(el.x, el.y, el.w, el.h)
  }
  if (el.style.border) {
    ctx.strokeStyle = el.style.border
    ctx.lineWidth = 2
    ctx.strokeRect(el.x, el.y, el.w, el.h)
  }
  const weight = el.style.bold ? '700' : '400'
  const style = el.style.italic ? 'italic' : 'normal'
  ctx.font = `${style} ${weight} ${el.style.fontSize}px ${FONT_STACKS[el.style.fontFamily]}`
  ctx.fillStyle = el.style.textColor
  ctx.textBaseline = 'top'
  ctx.textAlign = el.style.align === 'center' ? 'center' : el.style.align === 'right' ? 'right' : 'left'
  const padding = 10
  const lineHeight = el.style.fontSize * 1.3
  const lines = wrapText(ctx, el.text || '', el.w - padding * 2)
  const anchorX =
    el.style.align === 'center' ? el.x + el.w / 2 : el.style.align === 'right' ? el.x + el.w - padding : el.x + padding
  lines.forEach((line, i) => {
    ctx.fillText(line, anchorX, el.y + padding + i * lineHeight)
  })
}

function drawStickerElement(ctx: CanvasRenderingContext2D, el: Extract<PageElement, { type: 'sticker' }>) {
  ctx.font = `${el.size}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(el.emoji, el.x, el.y)
}

export function renderPageToCanvas(page: Page, width: number, height: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const finish = () => {
      for (const stroke of page.strokes) drawStroke(ctx, stroke)
      for (const el of page.elements) {
        if (el.type === 'text') drawTextElement(ctx, el)
        else drawStickerElement(ctx, el)
      }
      resolve(canvas)
    }

    if (page.background) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        finish()
      }
      img.onerror = finish
      img.src = page.background
    } else {
      finish()
    }
  })
}

function downloadDataURL(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function exportPageAsImage(
  page: Page,
  width: number,
  height: number,
  filename: string,
): Promise<void> {
  const canvas = await renderPageToCanvas(page, width, height)
  downloadDataURL(canvas.toDataURL('image/png'), filename)
}

export async function exportNotebookAsPdf(
  notebook: Notebook,
  pageWidth: number,
  pageHeight: number,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const orientation = pageWidth >= pageHeight ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [pageWidth, pageHeight] })

  for (let i = 0; i < notebook.pages.length; i++) {
    const canvas = await renderPageToCanvas(notebook.pages[i], pageWidth, pageHeight)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    if (i > 0) pdf.addPage([pageWidth, pageHeight], orientation)
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight)
  }

  pdf.save(`${notebook.name || 'cuaderno'}.pdf`)
}

export async function canShareFiles(files: File[]): Promise<boolean> {
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean }
  return typeof nav.canShare === 'function' && nav.canShare({ files })
}

export async function sharePageImage(page: Page, width: number, height: number, filename: string) {
  const canvas = await renderPageToCanvas(page, width, height)
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return false
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { share?: (data: ShareData & { files?: File[] }) => Promise<void> }
  if (await canShareFiles([file]) && nav.share) {
    await nav.share({ files: [file], title: filename })
    return true
  }
  downloadDataURL(canvas.toDataURL('image/png'), filename)
  return false
}
