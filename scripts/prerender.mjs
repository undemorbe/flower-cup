// Пререндер для SEO: после обычной сборки собираем серверную версию приложения
// и сохраняем каждую страницу каталога готовым HTML, плюс sitemap.xml и robots.txt.
//
// Контент берётся из API (CONTENT_API_URL), если он задан и отвечает, иначе - mock из shared/.
import { build } from 'vite'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const dist = join(root, 'dist')
const ssrOut = join(root, 'node_modules/.cache/flower-cup-ssr')
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const siteUrl = (process.env.VITE_SITE_URL || pkg.homepage || '').replace(/\/+$/, '')
const apiUrl = (process.env.CONTENT_API_URL || '').replace(/\/+$/, '')

await build({
  root,
  logLevel: 'warn',
  build: { ssr: 'src/entry-server.js', outDir: ssrOut, emptyOutDir: true, minify: false },
})
const { render, publicView, validateContent } = await import(pathToFileURL(join(ssrOut, 'entry-server.js')).href)

async function loadContent() {
  const seed = JSON.parse(readFileSync(join(root, 'shared/seed-content.json'), 'utf8'))
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/content`, { signal: AbortSignal.timeout(10_000) })
      const checked = validateContent(await res.json())
      if (res.ok && checked.ok) {
        console.log(`prerender: контент из ${apiUrl}`)
        return publicView(checked.value)
      }
      console.warn('prerender: API ответил не по схеме, берём mock')
    } catch (err) {
      console.warn(`prerender: API недоступен (${err.message}), берём mock`)
    }
  }
  const checked = validateContent(seed)
  if (!checked.ok) throw new Error(`seed-content.json не проходит схему: ${JSON.stringify(checked.errors)}`)
  return publicView(checked.value)
}

const content = await loadContent()
const template = readFileSync(join(dist, 'index.html'), 'utf8')
const safeJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c')
const snapshot = `<script type="application/json" id="fc-content">${safeJson(content)}</script>`

function page({ html = '', headTags = '', extraHead = '' }) {
  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `    ${headTags}\n    ${extraHead}\n  </head>`)
    .replace('<div id="app"></div>', `<div id="app">${html}</div>\n    ${snapshot}`)
}

function write(route, file) {
  const path = route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, file)
}

const routes = [
  '/',
  '/bouquets',
  '/plants',
  '/faq',
  '/reviews',
  '/contacts',
  ...content.pages.map((p) => `/${p.slug}`),
  ...content.bouquets.map((b) => `/bouquets/${b.slug}`),
  ...content.plants.map((p) => `/plants/${p.slug}`),
]

for (const route of routes) {
  const { html, head, notFound } = await render(route, content)
  if (notFound) throw new Error(`prerender: ${route} отрисовался как «не найдено»`)
  write(route, page({ html, headTags: head }))
}

// QR-ссылки: пустая оболочка приложения (оно само найдёт цель и посчитает переход через API),
// а без JavaScript сработает обычный meta refresh
const targetPath = (t) => ({ plant: `plants/${t.slug}/`, bouquet: `bouquets/${t.slug}/`, page: `${t.slug}/` })[t.type] ?? ''
for (const q of content.qr) {
  const to = `${base}${targetPath(q.target)}?from=qr`
  write(`/q/${q.code}`, page({
    headTags: '<title>Flower Cup</title>\n    <meta name="robots" content="noindex, nofollow">',
    extraHead: `<noscript><meta http-equiv="refresh" content="0; url=${to}"></noscript>`,
  }))
}

// Адрес админки в robots.txt не пишем - он бы его и выдал. Админка закрыта meta noindex.

// GitHub Pages отдаёт 404.html на любой незнакомый адрес - пусть это будет оболочка приложения:
// новые разделы и QR-коды, созданные после сборки, откроются через API
// Внутри - готовая своя страница 404 (видна сразу и без JavaScript), поверх неё стартует приложение.
const notFound = await render('/__/not-found', content)
if (!notFound.notFound) throw new Error('prerender: страница 404 отрисовалась как обычная')
writeFileSync(join(dist, '404.html'), page({ html: notFound.html, headTags: notFound.head }))
writeFileSync(join(dist, '.nojekyll'), '')

if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = routes
    .map((r) => `  <url><loc>${siteUrl}${r === '/' ? '/' : `${r}/`}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')
  writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
  writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${base}q/\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
} else {
  console.warn('prerender: VITE_SITE_URL не задан - sitemap.xml и robots.txt не созданы')
}

rmSync(ssrOut, { recursive: true, force: true })
console.log(`prerender: ${routes.length} страниц, ${content.qr.length} QR-ссылок`)
