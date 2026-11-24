// HTTP-API Flower Cup. Только node:http, без фреймворков.
//
// Публичное:
//   GET  /api/health
//   GET  /api/content            опубликованный контент для сайта
//   GET  /api/qr/:code           куда ведёт QR-код (+ счётчик переходов)
// Админка (Authorization: Bearer <token>):
//   POST /api/admin/login        { password } -> { token, expiresAt }
//   GET  /api/admin/content      весь контент + статистика QR
//   POST /api/admin/changes      { revision, change } -> { revision }
import { publicView, QR_CODE } from '../shared/schema.js'
import { verifyPassword, issueToken, verifyToken, RateLimiter } from './auth.js'

const MAX_BODY = 256 * 1024

class HttpError extends Error {
  constructor(status, message, details = []) {
    super(message)
    this.status = status
    this.details = details
  }
}

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'cross-origin-resource-policy': 'cross-origin',
}

function send(res, status, body, headers = {}) {
  const data = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  })
  res.end(data)
}

async function readJson(req) {
  if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) throw new HttpError(415, 'Нужен JSON')
  const declared = Number(req.headers['content-length'] ?? 0)
  if (declared > MAX_BODY) throw new HttpError(413, 'Слишком большой запрос')
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new HttpError(413, 'Слишком большой запрос')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Некорректный JSON')
  }
}

export function createHandler({ store, config, onChange = () => {} }) {
  const loginLimiter = new RateLimiter(config.loginLimit ?? 5, config.loginWindowMs ?? 15 * 60 * 1000)
  const qrLimiter = new RateLimiter(60, 60 * 1000)
  const allowed = new Set(config.allowedOrigins ?? [])
  const adminEnabled = Boolean(config.passwordHash && config.sessionSecret)

  const clientIp = (req) =>
    (config.trustProxy && String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()) || req.socket.remoteAddress || 'unknown'

  function cors(req, isPublicGet) {
    const origin = req.headers.origin
    if (isPublicGet) return { 'access-control-allow-origin': '*' }
    if (origin && allowed.has(origin)) {
      return {
        'access-control-allow-origin': origin,
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-max-age': '600',
        vary: 'Origin',
      }
    }
    return { vary: 'Origin' }
  }

  function requireAdmin(req) {
    if (!adminEnabled) throw new HttpError(503, 'Админка не настроена: задайте ADMIN_PASSWORD_HASH и SESSION_SECRET')
    // Запросы из браузера принимаем только с разрешённых сайтов
    const origin = req.headers.origin
    if (origin && !allowed.has(origin)) throw new HttpError(403, 'Запрос с чужого сайта')
    const auth = req.headers.authorization ?? ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!verifyToken(token, config.sessionSecret)) throw new HttpError(401, 'Войдите заново')
  }

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname.replace(/\/+$/, '') || '/'
    const isPublicGet = req.method === 'GET' && (path === '/api/content' || path === '/api/health' || path.startsWith('/api/qr/'))
    const headers = cors(req, isPublicGet)

    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, { ...SECURITY_HEADERS, ...headers })
        return res.end()
      }

      if (req.method === 'GET' && path === '/api/health') {
        return send(res, 200, { ok: true, revision: store.revision, admin: adminEnabled }, headers)
      }

      if (req.method === 'GET' && path === '/api/content') {
        const etag = `"r${store.revision}"`
        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304, { ...SECURITY_HEADERS, ...headers, etag })
          return res.end()
        }
        return send(res, 200, publicView(store.content), { ...headers, etag, 'cache-control': 'public, max-age=30' })
      }

      const qrMatch = path.match(/^\/api\/qr\/([^/]+)$/)
      if (req.method === 'GET' && qrMatch) {
        let code
        try {
          code = decodeURIComponent(qrMatch[1]).toLowerCase()
        } catch {
          throw new HttpError(404, 'QR-код не найден')
        }
        if (!QR_CODE.test(code) || code.length > 32) throw new HttpError(404, 'QR-код не найден')
        const qr = store.content.qr.find((q) => q.code === code && q.active !== false)
        if (!qr) throw new HttpError(404, 'QR-код не найден')
        if (qrLimiter.take(clientIp(req)).ok) store.countScan(code)
        return send(res, 200, { target: qr.target }, headers)
      }

      if (req.method === 'POST' && path === '/api/admin/login') {
        if (!adminEnabled) throw new HttpError(503, 'Админка не настроена: задайте ADMIN_PASSWORD_HASH и SESSION_SECRET')
        const origin = req.headers.origin
        if (origin && !allowed.has(origin)) throw new HttpError(403, 'Запрос с чужого сайта')
        const limit = loginLimiter.take(clientIp(req))
        if (!limit.ok) throw new HttpError(429, `Слишком много попыток. Повторите через ${limit.retryAfter} с`)
        const body = await readJson(req)
        if (!verifyPassword(body?.password, config.passwordHash)) throw new HttpError(401, 'Неверный пароль')
        return send(res, 200, issueToken(config.sessionSecret, config.sessionTtlMs ?? 12 * 60 * 60 * 1000), headers)
      }

      if (req.method === 'GET' && path === '/api/admin/content') {
        requireAdmin(req)
        return send(res, 200, { revision: store.revision, content: store.content, stats: store.stats }, headers)
      }

      if (req.method === 'POST' && path === '/api/admin/changes') {
        requireAdmin(req)
        const body = await readJson(req)
        if (!Number.isInteger(body?.revision)) throw new HttpError(422, 'Не указана версия данных')
        const result = await store.apply(body.change, body.revision)
        if (!result.ok) throw new HttpError(result.status, result.error, result.details)
        onChange(result.revision)
        return send(res, 200, { revision: result.revision }, headers)
      }

      throw new HttpError(404, 'Не найдено')
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message, details: err.details }, headers)
      console.error(err)
      return send(res, 500, { error: 'Ошибка сервера' }, headers)
    }
  }
}
