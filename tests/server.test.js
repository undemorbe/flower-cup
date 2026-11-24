import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readdir, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hashPassword, verifyPassword, issueToken, verifyToken, RateLimiter } from '../server/auth.js'
import { ContentStore } from '../server/store.js'
import { createHandler } from '../server/app.js'
import { readConfig } from '../server/config.js'
import { content } from './helpers.js'

const SECRET = 'x'.repeat(40)

describe('auth', () => {
  it('пароль: верный проходит, неверный и мусор - нет', () => {
    const hash = hashPassword('correct horse battery')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(verifyPassword('correct horse battery', hash)).toBe(true)
    expect(verifyPassword('wrong', hash)).toBe(false)
    expect(verifyPassword(undefined, hash)).toBe(false)
    expect(verifyPassword({}, hash)).toBe(false)
    expect(verifyPassword('x'.repeat(300), hash)).toBe(false)
    expect(verifyPassword('a', 'not-a-hash')).toBe(false)
  })

  it('одинаковые пароли дают разные хеши (соль)', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'))
  })

  it('токен: живой, просроченный, подделанный, чужой секрет', () => {
    const now = 1_000_000
    const { token } = issueToken(SECRET, 1000, now)
    expect(verifyToken(token, SECRET, now + 500)).toBe(true)
    expect(verifyToken(token, SECRET, now + 1001)).toBe(false)
    expect(verifyToken(token, 'y'.repeat(40), now)).toBe(false)
    const [payload, mac] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'admin', exp: now * 10 })).toString('base64url')
    expect(verifyToken(`${forged}.${mac}`, SECRET, now)).toBe(false)
    expect(verifyToken(`${payload}.`, SECRET, now)).toBe(false)
    expect(verifyToken(null, SECRET, now)).toBe(false)
    expect(verifyToken('a'.repeat(600), SECRET, now)).toBe(false)
  })

  it('RateLimiter: лимит в окне и сброс после окна', () => {
    const rl = new RateLimiter(2, 1000)
    expect(rl.take('ip', 0).ok).toBe(true)
    expect(rl.take('ip', 10).ok).toBe(true)
    const blocked = rl.take('ip', 20)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBe(1)
    expect(rl.take('other', 20).ok).toBe(true)
    expect(rl.take('ip', 1001).ok).toBe(true)
  })
})

describe('config', () => {
  it('требует длинный SESSION_SECRET при заданном пароле', () => {
    expect(() => readConfig({ ADMIN_PASSWORD_HASH: 'h', SESSION_SECRET: 'short' })).toThrow(/32/)
  })

  it('ALLOWED_ORIGINS: только origin без пути', () => {
    expect(readConfig({ ALLOWED_ORIGINS: 'https://a.example/, https://b.example' }).allowedOrigins).toEqual([
      'https://a.example',
      'https://b.example',
    ])
    expect(() => readConfig({ ALLOWED_ORIGINS: 'https://a.example/path' })).toThrow(/origin/)
  })

  it('по умолчанию слушает только localhost', () => {
    expect(readConfig({}).host).toBe('127.0.0.1')
  })
})

describe('ContentStore', () => {
  let dir
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'fc-store-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('стартует с seed, пишет файл с правами 0600', async () => {
    const store = await new ContentStore(dir, content()).init()
    expect(store.revision).toBe(1)
    expect((await stat(join(dir, 'content.json'))).mode & 0o777).toBe(0o600)
  })

  it('ревизия защищает от затирания, правка делает бэкап', async () => {
    const store = await new ContentStore(dir, content()).init()
    const change = { op: 'site', site: { ...store.content.site, name: 'Новое имя' } }
    expect(await store.apply(change, 1)).toEqual({ ok: true, revision: 2 })
    expect((await store.apply(change, 1)).status).toBe(409)
    expect(await readdir(join(dir, 'backups'))).toHaveLength(1)
    const again = await new ContentStore(dir, content()).init()
    expect(again.revision).toBe(2)
    expect(again.content.site.name).toBe('Новое имя')
  })

  it('параллельные правки с одной ревизией: проходит только одна', async () => {
    const store = await new ContentStore(dir, content()).init()
    const site = store.content.site
    const results = await Promise.all([
      store.apply({ op: 'site', site: { ...site, name: 'A' } }, 1),
      store.apply({ op: 'site', site: { ...site, name: 'B' } }, 1),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(store.revision).toBe(2)
  })
})

// ---------- HTTP ----------

function fakeReq({ method = 'GET', url = '/', headers = {}, body } = {}) {
  const chunks = body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]
  return {
    method,
    url,
    headers: { ...(body !== undefined && { 'content-type': 'application/json' }), ...headers },
    socket: { remoteAddress: '10.0.0.1' },
    async *[Symbol.asyncIterator]() {
      yield* chunks
    },
  }
}

function fakeRes() {
  return {
    status: 0,
    headers: {},
    body: '',
    writeHead(status, headers) {
      this.status = status
      this.headers = headers
    },
    end(data = '') {
      this.body = data
    },
    get json() {
      return this.body ? JSON.parse(this.body) : null
    },
  }
}

describe('HTTP API', () => {
  let dir, store, handle, changes
  const ORIGIN = 'https://site.example'
  const call = async (opts) => {
    const res = fakeRes()
    await handle(fakeReq(opts), res)
    return res
  }
  const login = async () => (await call({ method: 'POST', url: '/api/admin/login', body: { password: 'secret-password' } })).json.token

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'fc-api-'))
    store = await new ContentStore(dir, content()).init()
    changes = []
    handle = createHandler({
      store,
      config: { passwordHash: hashPassword('secret-password'), sessionSecret: SECRET, allowedOrigins: [ORIGIN], loginLimit: 3 },
      onChange: (r) => changes.push(r),
    })
  })
  afterEach(async () => {
    clearTimeout(store.statsTimer)
    await rm(dir, { recursive: true, force: true })
  })

  it('публичный контент: только опубликованное, ETag, CORS *, защитные заголовки', async () => {
    const res = await call({ url: '/api/content' })
    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('*')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.json.qr[0]).not.toHaveProperty('label')
    const cached = await call({ url: '/api/content', headers: { 'if-none-match': res.headers.etag } })
    expect(cached.status).toBe(304)
  })

  it('QR: находит цель, считает переход, отклоняет мусор', async () => {
    const code = store.content.qr[0].code
    const res = await call({ url: `/api/qr/${code}` })
    expect(res.json.target).toEqual(store.content.qr[0].target)
    expect(store.stats.qr[code].scans).toBe(1)
    expect((await call({ url: '/api/qr/net-takogo' })).status).toBe(404)
    expect((await call({ url: '/api/qr/%E0%A4%A' })).status).toBe(404)
    expect((await call({ url: '/api/qr/..%2F..%2Fetc' })).status).toBe(404)
  })

  it('вход: неверный пароль 401, лимит попыток 429', async () => {
    const bad = { method: 'POST', url: '/api/admin/login', body: { password: 'nope' } }
    expect((await call(bad)).status).toBe(401)
    await call(bad)
    await call(bad)
    expect((await call(bad)).status).toBe(429)
  })

  it('вход с чужого сайта запрещён', async () => {
    const res = await call({ method: 'POST', url: '/api/admin/login', headers: { origin: 'https://evil.example' }, body: { password: 'secret-password' } })
    expect(res.status).toBe(403)
  })

  it('админка без токена 401, с токеном 200; чужой origin 403', async () => {
    expect((await call({ url: '/api/admin/content' })).status).toBe(401)
    const token = await login()
    const ok = await call({ url: '/api/admin/content', headers: { authorization: `Bearer ${token}`, origin: ORIGIN } })
    expect(ok.status).toBe(200)
    expect(ok.headers['access-control-allow-origin']).toBe(ORIGIN)
    const evil = await call({ url: '/api/admin/content', headers: { authorization: `Bearer ${token}`, origin: 'https://evil.example' } })
    expect(evil.status).toBe(403)
  })

  it('правки: успех, конфликт ревизий, 415, 413, битый JSON', async () => {
    const auth = { authorization: `Bearer ${await login()}` }
    const change = { op: 'upsert', collection: 'faq', item: { id: 'api-q', q: 'Вопрос?', a: 'Ответ.' } }
    const ok = await call({ method: 'POST', url: '/api/admin/changes', headers: auth, body: { revision: 1, change } })
    expect(ok.json).toEqual({ revision: 2 })
    expect(changes).toEqual([2])
    expect((await call({ method: 'POST', url: '/api/admin/changes', headers: auth, body: { revision: 1, change } })).status).toBe(409)
    expect((await call({ method: 'POST', url: '/api/admin/changes', headers: { ...auth, 'content-type': 'text/plain' }, body: 'x' })).status).toBe(415)
    expect((await call({ method: 'POST', url: '/api/admin/changes', headers: { ...auth, 'content-length': String(1024 * 1024) }, body: {} })).status).toBe(413)
    expect((await call({ method: 'POST', url: '/api/admin/changes', headers: auth, body: '{oops' })).status).toBe(400)
    expect((await call({ method: 'POST', url: '/api/admin/changes', headers: auth, body: { change } })).status).toBe(422)
  })

  it('без настроенного пароля админка выключена (503)', async () => {
    const h = createHandler({ store, config: {} })
    const res = fakeRes()
    await h(fakeReq({ method: 'POST', url: '/api/admin/login', body: { password: 'x' } }), res)
    expect(res.status).toBe(503)
  })

  it('неизвестный адрес 404, ошибки не раскрывают внутренности', async () => {
    const res = await call({ url: '/api/nope' })
    expect(res.status).toBe(404)
    expect(res.json).toEqual({ error: 'Не найдено', details: [] })
  })
})
