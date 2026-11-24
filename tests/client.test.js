import { describe, it, expect, vi, beforeEach } from 'vitest'
import { acceptContent, readSnapshot, readDemo, fetchContent, loadContent, state, DEMO_KEY } from '../src/content/store.js'
import { parseOrder, orderMessage } from '../src/composables/useOrder.js'
import { parsePlanted } from '../src/composables/usePlanting.js'
import { directionOf } from '../src/composables/useNav.js'
import { buildHead, renderHeadTags, safeJson, absoluteUrl, ld } from '../src/seo/head.js'
import { blank, randomId } from '../src/admin/blank.js'
import { createDemoAdmin, createHttpAdmin, AdminError } from '../src/admin/api.js'
import { specs, validateItem, validateContent } from '../shared/schema.js'
import { content, memoryStorage } from './helpers.js'

const okResponse = (data, status = 200) => ({ ok: status < 400, status, json: async () => data })

describe('store: откуда берётся контент', () => {
  it('acceptContent пропускает только валидное и отдаёт публичный вид', () => {
    expect(acceptContent({ site: {} })).toBeNull()
    const c = content()
    c.faq[0].published = false
    expect(acceptContent(c).faq.some((f) => f.id === c.faq[0].id)).toBe(false)
  })

  it('readSnapshot: битый JSON и чужие данные игнорируются', () => {
    const doc = (text) => ({ getElementById: () => ({ textContent: text }) })
    expect(readSnapshot(doc('{oops'))).toBeNull()
    expect(readSnapshot(doc('{"site":1}'))).toBeNull()
    expect(readSnapshot(doc(JSON.stringify(content()))).site.name).toBe(content().site.name)
    expect(readSnapshot({ getElementById: () => null })).toBeNull()
  })

  it('readDemo: только валидный черновик', () => {
    expect(readDemo(memoryStorage({ [DEMO_KEY]: '{oops' }))).toBeNull()
    expect(readDemo(memoryStorage())).toBeNull()
    expect(readDemo(memoryStorage({ [DEMO_KEY]: JSON.stringify(content()) }))).not.toBeNull()
  })

  it('fetchContent: ошибка статуса и не-схема -> исключение', async () => {
    await expect(fetchContent(async () => okResponse({}, 500), 'https://api')).rejects.toThrow('500')
    await expect(fetchContent(async () => okResponse({ site: 1 }), 'https://api')).rejects.toThrow('схеме')
    const c = await fetchContent(async () => okResponse(content()), 'https://api')
    expect(c.plants.length).toBeGreaterThan(0)
  })

  it('loadContent: API упал -> сайт работает на встроенных данных', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await loadContent({ apiUrl: 'https://api', fetchImpl: async () => { throw new Error('offline') }, doc: { getElementById: () => null } })
    expect(state.status).toBe('error')
    expect(state.content.plants.length).toBeGreaterThan(0)
  })

  it('loadContent без API берёт демо-черновик', async () => {
    const c = content()
    c.site.name = 'Демо-имя'
    await loadContent({ apiUrl: '', storage: memoryStorage({ [DEMO_KEY]: JSON.stringify(c) }), doc: { getElementById: () => null } })
    expect(state.source).toBe('demo')
    expect(state.content.site.name).toBe('Демо-имя')
  })
})

describe('заказ и посадка: данные из localStorage не доверенные', () => {
  it('parseOrder берёт только слаги', () => {
    expect(parseOrder('{"bouquet":"letniy","seed":"bazilik"}')).toEqual({ bouquet: 'letniy', seed: 'bazilik' })
    expect(parseOrder('{"bouquet":"<img onerror=x>","seed":42}')).toEqual({ bouquet: null, seed: null })
    expect(parseOrder('oops')).toEqual({ bouquet: null, seed: null })
    expect(parseOrder(null)).toEqual({ bouquet: null, seed: null })
  })

  it('orderMessage', () => {
    expect(orderMessage(null)).toBe('')
    expect(orderMessage({ name: 'Лето', price: 1500 }, { name: 'Базилик' })).toBe('Здравствуйте! Хочу заказать: Букет «Лето», семечко: базилик (1500 ₽).')
  })

  it('parsePlanted отбрасывает мусор и даты из будущего', () => {
    const now = Date.UTC(2026, 0, 10)
    const raw = JSON.stringify({ bazilik: Date.UTC(2026, 0, 1), 'Bad Slug': now, old: 5, future: now + 86_400_000, str: 'x' })
    expect(parsePlanted(raw, now)).toEqual({ bazilik: Date.UTC(2026, 0, 1) })
    expect(parsePlanted('[1,2]', now)).toEqual({})
    expect(parsePlanted('oops', now)).toEqual({})
  })
})

describe('навигация', () => {
  it('directionOf', () => {
    expect(directionOf(0, 1, true)).toBe('none')
    expect(directionOf(2, 3, false)).toBe('forward')
    expect(directionOf(3, 2, false)).toBe('back')
  })
})

describe('SEO', () => {
  const site = content().site
  const URL = 'https://ex.example/fc'

  it('absoluteUrl добавляет слэш в конце', () => {
    expect(absoluteUrl('/', URL)).toBe('https://ex.example/fc/')
    expect(absoluteUrl('/plants/bazilik', URL)).toBe('https://ex.example/fc/plants/bazilik/')
    expect(absoluteUrl('faq//', URL)).toBe('https://ex.example/fc/faq/')
  })

  it('buildHead: title, canonical, noindex', () => {
    const h = buildHead({ title: 'Базилик', description: 'Описание', path: '/plants/bazilik' }, site, URL)
    expect(h.title).toBe(`Базилик - ${site.name}`)
    expect(h.links).toEqual([{ rel: 'canonical', href: 'https://ex.example/fc/plants/bazilik/' }])
    expect(h.metas.find((m) => m.name === 'robots').content).toBe('index, follow')
    const hidden = buildHead({ title: 'Админка', path: '/x', noindex: true }, site, URL)
    expect(hidden.links).toEqual([])
    expect(hidden.metas.find((m) => m.name === 'robots').content).toBe('noindex, nofollow')
  })

  it('og:image только если картинка есть', () => {
    const without = buildHead({ title: 'x' }, site, URL, '')
    expect(without.metas.some((m) => m.property === 'og:image')).toBe(false)
    expect(without.metas.find((m) => m.name === 'twitter:card').content).toBe('summary')
    const withImg = buildHead({ title: 'x' }, site, URL, '/og.png')
    expect(withImg.metas.find((m) => m.property === 'og:image').content).toBe('https://ex.example/fc/og.png')
  })

  it('длинное описание обрезается до 200', () => {
    const h = buildHead({ title: 'x', description: 'а'.repeat(500) }, site, URL)
    expect(h.metas[0].content.length).toBeLessThanOrEqual(200)
  })

  it('renderHeadTags экранирует контент, JSON-LD не закрывает script', () => {
    const h = buildHead({ title: '"><script>alert(1)</script>', description: 'a&b', jsonLd: [{ name: '</script><script>x()</script>' }] }, site, URL)
    const html = renderHeadTags(h)
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('a&amp;b')
    expect(html).not.toContain('</script><script>x()')
    expect(safeJson({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}')
  })

  it('JSON-LD: цена только если она есть', () => {
    const b = content().bouquets[0]
    expect(ld.product({ ...b, price: null }, site, URL).offers).toBeUndefined()
    expect(ld.product({ ...b, price: 900 }, site, URL).offers.price).toBe('900')
    expect(ld.howTo(content().plants[0], URL).step[0].position).toBe(1)
  })
})

describe('админка', () => {
  it('blank: пустая запись совпадает с формой схемы', () => {
    const plant = blank(specs.plants)
    expect(Object.keys(plant).sort()).toEqual(Object.keys(specs.plants.fields).sort())
    expect(plant.care).toHaveLength(1)
    expect(blank(specs.bouquets).price).toBeNull()
    expect(blank(specs.qr).active).toBe(true)
  })

  it('blank + заполнение проходит валидацию', () => {
    const faq = { ...blank(specs.faq), id: randomId('q'), q: 'Вопрос', a: 'Ответ' }
    expect(validateItem('faq', faq).ok).toBe(true)
    expect(randomId('q')).toMatch(/^q-[a-z0-9]{1,6}$/)
  })

  describe('демо-адаптер', () => {
    let storage, admin
    beforeEach(() => {
      storage = memoryStorage()
      admin = createDemoAdmin({ storage })
    })

    it('стартует с mock и ревизии 1', async () => {
      const { content: c, revision } = await admin.load()
      expect(revision).toBe(1)
      expect(validateContent(c).ok).toBe(true)
    })

    it('сохраняет правку и растит ревизию', async () => {
      const { content: c, revision } = await admin.load()
      const res = await admin.change(revision, { op: 'site', site: { ...c.site, name: 'Демо' } })
      expect(res.revision).toBe(2)
      expect((await admin.load()).content.site.name).toBe('Демо')
    })

    it('устаревшая ревизия -> 409, ошибка схемы -> AdminError', async () => {
      await expect(admin.change(5, { op: 'drop' })).rejects.toMatchObject({ status: 409 })
      await expect(admin.change(1, { op: 'drop' })).rejects.toBeInstanceOf(AdminError)
    })

    it('битый черновик -> снова mock; reset чистит', async () => {
      storage.setItem(DEMO_KEY, '{oops')
      expect((await admin.load()).revision).toBe(1)
      admin.reset()
      expect(storage.size).toBe(0)
    })
  })

  describe('HTTP-адаптер', () => {
    it('хранит токен в sessionStorage и шлёт Bearer', async () => {
      const storage = memoryStorage()
      const calls = []
      const fetchImpl = async (url, init) => {
        calls.push({ url, init })
        return url.endsWith('/login') ? okResponse({ token: 't0k', expiresAt: Date.now() + 60_000 }) : okResponse({ revision: 1 })
      }
      const admin = createHttpAdmin({ apiUrl: 'https://api', fetchImpl, storage })
      expect(admin.isLoggedIn()).toBe(false)
      await admin.login('pw')
      expect(admin.isLoggedIn()).toBe(true)
      await admin.load()
      expect(calls[1].init.headers.authorization).toBe('Bearer t0k')
      expect(calls[1].init.credentials).toBe('omit')
    })

    it('401 разлогинивает, сеть недоступна -> понятная ошибка', async () => {
      const storage = memoryStorage({ 'flowercup:admin-session': JSON.stringify({ token: 't', expiresAt: Date.now() + 60_000 }) })
      const admin = createHttpAdmin({ apiUrl: 'https://api', fetchImpl: async () => okResponse({ error: 'Войдите заново' }, 401), storage })
      expect(admin.isLoggedIn()).toBe(true)
      await expect(admin.load()).rejects.toMatchObject({ status: 401 })
      expect(admin.isLoggedIn()).toBe(false)
      const offline = createHttpAdmin({ apiUrl: 'https://api', fetchImpl: async () => { throw new TypeError('fail') }, storage })
      await expect(offline.load()).rejects.toThrow('Бэкенд недоступен')
    })

    it('просроченная сессия не считается входом', () => {
      const storage = memoryStorage({ 'flowercup:admin-session': JSON.stringify({ token: 't', expiresAt: Date.now() - 1 }) })
      expect(createHttpAdmin({ apiUrl: 'https://api', storage }).isLoggedIn()).toBe(false)
    })
  })
})
