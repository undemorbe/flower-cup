// Два режима админки с одинаковым интерфейсом:
// - api:  настоящий бэкенд (VITE_API_URL), вход по паролю;
// - demo: бэкенда нет - правки хранятся в localStorage этого браузера и сразу видны на сайте в нём же.
import { API_URL, DEMO_KEY, mockContent, refreshDemo, reloadContent } from '../content/store.js'
import { applyChange } from '../../shared/mutations.js'
import { validateContent } from '../../shared/schema.js'

export class AdminError extends Error {
  constructor(message, status = 0, details = []) {
    super(message)
    this.status = status
    this.details = details ?? []
  }
}

const TOKEN_KEY = 'flowercup:admin-session'

export function createHttpAdmin({ apiUrl = API_URL, fetchImpl = (...a) => fetch(...a), storage = globalThis.sessionStorage } = {}) {
  const readSession = () => {
    try {
      const s = JSON.parse(storage.getItem(TOKEN_KEY))
      return s && typeof s.token === 'string' && s.expiresAt > Date.now() ? s : null
    } catch {
      return null
    }
  }
  let session = readSession()

  async function request(path, { method = 'GET', body } = {}) {
    let res
    try {
      res = await fetchImpl(`${apiUrl}${path}`, {
        method,
        credentials: 'omit',
        headers: {
          accept: 'application/json',
          ...(body && { 'content-type': 'application/json' }),
          ...(session && { authorization: `Bearer ${session.token}` }),
        },
        body: body && JSON.stringify(body),
      })
    } catch {
      throw new AdminError('Бэкенд недоступен. Проверьте, что сервер запущен.', 0)
    }
    const data = await res.json().catch(() => ({}))
    if (res.status === 401 && path !== '/api/admin/login') logout()
    if (!res.ok) throw new AdminError(data.error || `Ошибка ${res.status}`, res.status, data.details)
    return data
  }

  function logout() {
    session = null
    try {
      storage.removeItem(TOKEN_KEY)
    } catch {
      /* ничего */
    }
  }

  return {
    mode: 'api',
    isLoggedIn: () => Boolean(session && session.expiresAt > Date.now()),
    async login(password) {
      const data = await request('/api/admin/login', { method: 'POST', body: { password } })
      session = { token: data.token, expiresAt: data.expiresAt }
      storage.setItem(TOKEN_KEY, JSON.stringify(session))
    },
    logout,
    load: () => request('/api/admin/content'),
    async change(revision, change) {
      const data = await request('/api/admin/changes', { method: 'POST', body: { revision, change } })
      reloadContent()
      return data
    },
  }
}

export function createDemoAdmin({ storage = globalThis.localStorage } = {}) {
  const REV = `${DEMO_KEY}:revision`
  const read = () => {
    try {
      const raw = storage.getItem(DEMO_KEY)
      const checked = raw ? validateContent(JSON.parse(raw)) : null
      if (checked?.ok) return { content: checked.value, revision: Number(storage.getItem(REV)) || 1 }
    } catch {
      /* битый черновик - начинаем с mock */
    }
    return { content: validateContent(mockContent()).value, revision: 1 }
  }

  return {
    mode: 'demo',
    isLoggedIn: () => true,
    async login() {},
    logout() {},
    async load() {
      const { content, revision } = read()
      return { content, revision, stats: { qr: {} } }
    },
    async change(revision, change) {
      const current = read()
      if (current.revision !== revision) throw new AdminError('Черновик изменили в другой вкладке - обновите страницу', 409)
      const result = applyChange(current.content, change)
      if (!result.ok) throw new AdminError(result.error, result.status, result.details)
      try {
        storage.setItem(DEMO_KEY, JSON.stringify(result.content))
        storage.setItem(REV, String(revision + 1))
      } catch {
        throw new AdminError('Браузер не дал сохранить черновик (переполнено хранилище или приватный режим)')
      }
      refreshDemo(storage)
      return { revision: revision + 1 }
    },
    reset() {
      storage.removeItem(DEMO_KEY)
      storage.removeItem(REV)
      refreshDemo(storage)
    },
  }
}

export const createAdmin = () => (API_URL ? createHttpAdmin() : createDemoAdmin())
