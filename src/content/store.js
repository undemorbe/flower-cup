// Хранилище контента сайта.
//
// Откуда берутся данные, по порядку:
// 1. Снимок, встроенный в HTML при сборке (<script id="fc-content">), иначе mock из shared/seed-content.json.
//    Сайт работает сразу и без бэкенда.
// 2. Если задан VITE_API_URL - свежие данные из API. Не ответил или ответил мусором - остаёмся на снимке.
// 3. Без API: если в этом браузере открывали админку в демо-режиме - её черновик из localStorage.
//
// Всё, что приходит снаружи, проходит через ту же схему, что и на бэкенде.
import { reactive, computed } from 'vue'
import seed from '../../shared/seed-content.json'
import { validateContent, publicView, COLLECTIONS } from '../../shared/schema.js'
import { clone } from '../../shared/clone.js'

export const API_URL = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '')
export const DEMO_KEY = 'flowercup:demo-content'
const TIMEOUT = 6000

const initial = publicView(seed)

export const state = reactive({
  content: initial,
  source: 'mock', // mock | snapshot | api | demo
  status: 'idle', // idle | loading | ready | error
  error: null,
})

export function setContent(content, source) {
  state.content = content
  state.source = source
}

// Принимаем только то, что прошло схему. Возвращает публичный вид или null.
export function acceptContent(raw) {
  const result = validateContent(raw)
  return result.ok ? publicView(result.value) : null
}

export function readSnapshot(doc = globalThis.document) {
  const el = doc?.getElementById?.('fc-content')
  if (!el) return null
  try {
    return acceptContent(JSON.parse(el.textContent))
  } catch {
    return null
  }
}

export function readDemo(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(DEMO_KEY)
    return raw ? acceptContent(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export async function fetchContent(fetchImpl = globalThis.fetch, apiUrl = API_URL) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  try {
    const res = await fetchImpl(`${apiUrl}/api/content`, {
      signal: ctrl.signal,
      credentials: 'omit',
      headers: { accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`API ответил ${res.status}`)
    const content = acceptContent(await res.json())
    if (!content) throw new Error('API вернул данные не по схеме')
    return content
  } finally {
    clearTimeout(timer)
  }
}

let pending = null

export function loadContent({ fetchImpl, apiUrl = API_URL, storage, doc } = {}) {
  if (pending) return pending
  const snapshot = readSnapshot(doc)
  if (snapshot) setContent(snapshot, 'snapshot')

  if (!apiUrl) {
    const demo = readDemo(storage)
    if (demo) setContent(demo, 'demo')
    state.status = 'ready'
    return (pending = Promise.resolve(state.content))
  }

  state.status = 'loading'
  pending = fetchContent(fetchImpl, apiUrl)
    .then((content) => {
      setContent(content, 'api')
      state.status = 'ready'
      state.error = null
    })
    .catch((err) => {
      // Бэкенд недоступен - сайт продолжает работать на снимке/mock
      state.status = 'error'
      state.error = err.message
      if (typeof console !== 'undefined') console.warn('Контент из API недоступен, показываем встроенные данные:', err.message)
    })
    .then(() => {
      pending = null
      return state.content
    })
  return pending
}

// Перечитать демо-черновик после правок в админке
export function refreshDemo(storage) {
  if (API_URL) return
  const demo = readDemo(storage)
  setContent(demo ?? initial, demo ? 'demo' : 'mock')
}

// Перечитать контент из API после правок в админке
export function reloadContent() {
  pending = null
  return loadContent()
}

export const mockContent = () => clone(seed)

// ---------- удобные выборки для компонентов ----------

const by = (list, key, value) => list.find((x) => x[key] === value) ?? null

export function useCatalog() {
  const c = computed(() => state.content)
  return {
    site: computed(() => c.value.site),
    pages: computed(() => c.value.pages),
    menuPages: computed(() => c.value.pages.filter((p) => p.inMenu)),
    bouquets: computed(() => c.value.bouquets),
    plants: computed(() => c.value.plants),
    faq: computed(() => c.value.faq),
    reviews: computed(() => c.value.reviews),
    findBouquet: (slug) => by(c.value.bouquets, 'slug', slug),
    findPlant: (slug) => by(c.value.plants, 'slug', slug),
    findPage: (slug) => by(c.value.pages, 'slug', slug),
    findQr: (code) => by(c.value.qr, 'code', code),
  }
}

export const collectionKey = (name) => COLLECTIONS[name].key
