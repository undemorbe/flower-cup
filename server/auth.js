// Пароль админки и токены сессии. Только node:crypto, без внешних зависимостей.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'

const N = 16384
const R = 8
const P = 1
const KEYLEN = 32

// Хеш хранится в переменной окружения ADMIN_PASSWORD_HASH, сам пароль - нигде
export function hashPassword(password, salt = randomBytes(16)) {
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P })
  return ['scrypt', N, R, P, salt.toString('base64url'), hash.toString('base64url')].join('$')
}

export function verifyPassword(password, stored) {
  if (typeof password !== 'string' || !password || password.length > 256 || typeof stored !== 'string') return false
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, saltB64, hashB64] = parts
  const expected = Buffer.from(hashB64, 'base64url')
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  })
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

const sign = (data, secret) => createHmac('sha256', secret).update(data).digest('base64url')

// Токен: base64url(JSON) + "." + HMAC. Без состояния на сервере, живёт ttl миллисекунд.
export function issueToken(secret, ttl, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: now + ttl, n: randomBytes(8).toString('base64url') })).toString('base64url')
  return { token: `${payload}.${sign(payload, secret)}`, expiresAt: now + ttl }
}

export function verifyToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 512) return false
  const [payload, mac] = token.split('.')
  if (!payload || !mac) return false
  const expected = Buffer.from(sign(payload, secret))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return data.sub === 'admin' && Number.isFinite(data.exp) && data.exp > now
  } catch {
    return false
  }
}

// Ограничитель попыток: не больше `limit` за `windowMs` с одного адреса
export class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit
    this.windowMs = windowMs
    this.hits = new Map()
  }

  take(key, now = Date.now()) {
    const fresh = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs)
    if (fresh.length >= this.limit) {
      this.hits.set(key, fresh)
      return { ok: false, retryAfter: Math.ceil((this.windowMs - (now - fresh[0])) / 1000) }
    }
    fresh.push(now)
    this.hits.set(key, fresh)
    if (this.hits.size > 10_000) this.hits.delete(this.hits.keys().next().value)
    return { ok: true }
  }
}
