const MAX_DIMENSION = 1600

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

export function imageToDataURL(img: HTMLImageElement, quality = 0.85): string {
  let { width, height } = img
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function importImageFile(file: File): Promise<string> {
  const img = await fileToImage(file)
  return imageToDataURL(img)
}
