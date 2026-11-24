// SEO: заголовок, описание, canonical, Open Graph и JSON-LD для каждой страницы.
// На клиенте теги обновляются при переходах, при сборке - попадают в статический HTML.
import { reactive, watchEffect } from 'vue'

export const SITE_URL = (import.meta.env?.VITE_SITE_URL || '').replace(/\/+$/, '')

export const head = reactive({ current: null })

const MANAGED = 'data-fc-head'

export function absoluteUrl(path, siteUrl = SITE_URL) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl}${clean === '/' ? '/' : clean.replace(/\/+$/, '') + '/'}`
}

const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s || '')

// Чистая функция: описание страницы -> набор тегов
const OG_IMAGE = import.meta.env?.VITE_OG_IMAGE || ''

export function buildHead(page, site, siteUrl = SITE_URL, ogImage = OG_IMAGE) {
  const title = page.title ? `${page.title} - ${site.name}` : site.seoTitle
  const description = clip(page.description || site.seoDescription, 200)
  const url = page.path ? absoluteUrl(page.path, siteUrl) : null
  const image = siteUrl && ogImage ? `${siteUrl}${ogImage}` : null

  const metas = [
    { name: 'description', content: description },
    { property: 'og:site_name', content: site.name },
    { property: 'og:type', content: page.type || 'website' },
    { property: 'og:title', content: page.title || site.seoTitle },
    { property: 'og:description', content: description },
    { property: 'og:locale', content: 'ru_RU' },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
  ]
  if (url) metas.push({ property: 'og:url', content: url })
  if (image) metas.push({ property: 'og:image', content: image }, { property: 'og:image:width', content: '1200' }, { property: 'og:image:height', content: '630' })
  metas.push({ name: 'robots', content: page.noindex ? 'noindex, nofollow' : 'index, follow' })

  const links = url && !page.noindex ? [{ rel: 'canonical', href: url }] : []
  return { title, metas, links, jsonLd: page.jsonLd ?? [] }
}

// ---------- JSON-LD ----------

export const ld = {
  organization: (site, siteUrl = SITE_URL) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: absoluteUrl('/', siteUrl),
    slogan: site.tagline,
    sameAs: [`https://t.me/${site.telegram}`],
  }),
  breadcrumbs: (items, siteUrl = SITE_URL) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path, siteUrl),
    })),
  }),
  product: (b, site, siteUrl = SITE_URL) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Букет «${b.name}»`,
    description: b.lead,
    brand: { '@type': 'Brand', name: site.name },
    url: absoluteUrl(`/bouquets/${b.slug}`, siteUrl),
    ...(b.price != null && {
      offers: {
        '@type': 'Offer',
        price: String(b.price),
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
        url: absoluteUrl(`/bouquets/${b.slug}`, siteUrl),
      },
    }),
  }),
  howTo: (p, siteUrl = SITE_URL) => ({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Как вырастить: ${p.name}`,
    description: p.lead,
    url: absoluteUrl(`/plants/${p.slug}`, siteUrl),
    step: p.care.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
  }),
  faq: (items) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }),
}

// ---------- вывод ----------

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])

// В JSON-LD экранируем "<", чтобы строка из контента не закрыла </script>
export const safeJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

export function renderHeadTags(h) {
  const attrs = (o) =>
    Object.entries(o)
      .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
      .join(' ')
  return [
    `<title>${escapeHtml(h.title)}</title>`,
    ...h.metas.map((m) => `<meta ${attrs(m)} ${MANAGED}>`),
    ...h.links.map((l) => `<link ${attrs(l)} ${MANAGED}>`),
    ...h.jsonLd.map((j) => `<script type="application/ld+json" ${MANAGED}>${safeJson(j)}</script>`),
  ].join('\n    ')
}

export function applyHead(h, doc = document) {
  doc.title = h.title
  doc.head.querySelectorAll(`[${MANAGED}]`).forEach((el) => el.remove())
  // Статические теги из index.html (description) заменяем управляемыми
  doc.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove())
  const add = (tag, attrs, text) => {
    const el = doc.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    el.setAttribute(MANAGED, '')
    if (text) el.textContent = text
    doc.head.appendChild(el)
  }
  h.metas.forEach((m) => add('meta', m))
  h.links.forEach((l) => add('link', l))
  h.jsonLd.forEach((j) => add('script', { type: 'application/ld+json' }, JSON.stringify(j)))
}

// Вызывается из страниц: useSeo(() => ({ title, description, path, jsonLd }))
export function useSeo(getPage) {
  // При пререндере эффекты не запускаются - считаем один раз
  if (import.meta.env?.SSR) {
    head.current = getPage()
    return
  }
  watchEffect(() => {
    head.current = getPage()
  })
}
