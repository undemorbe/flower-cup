// QR-коды для печати: матрица из qrcode-generator, отрисовка - наша (SVG/PNG без v-html)
import qrcode from 'qrcode-generator'
import { SITE_URL } from '../seo/head.js'

export const qrUrl = (code, siteUrl = SITE_URL) => `${siteUrl}/q/${code}`

export function qrMatrix(text, ecc = 'M') {
  const qr = qrcode(0, ecc)
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  return { n, dark: (r, c) => qr.isDark(r, c) }
}

// Один path на весь код: по квадратику на тёмный модуль
export function qrPath({ n, dark }, margin = 4) {
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`
  return { d, size: n + margin * 2 }
}

export function qrSvgString(text, { fg = '#24442f', bg = '#ffffff' } = {}) {
  const { d, size } = qrPath(qrMatrix(text))
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 10}" height="${size * 10}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`
}

export function qrPngBlob(text, { scale = 20, fg = '#24442f', bg = '#ffffff' } = {}) {
  const m = qrMatrix(text)
  const margin = 4
  const size = (m.n + margin * 2) * scale
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = fg
  for (let r = 0; r < m.n; r++) for (let c = 0; c < m.n; c++) if (m.dark(r, c)) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
