// Адрес админки. Не /admin: задаётся при сборке (VITE_ADMIN_PATH), чтобы её не находили перебором.
// Это не защита (настоящую даёт пароль на бэкенде) - просто админку не видно случайным людям и ботам.
import { SLUG, RESERVED_SLUGS } from './schema.js'

export const DEFAULT_ADMIN_PATH = '/studio-fc'

// Возвращает нормализованный путь вида /a/b или null, если адрес недопустим
export function normalizeAdminPath(raw) {
  if (typeof raw !== 'string') return null
  const segments = raw.trim().toLowerCase().split('/').filter(Boolean)
  if (!segments.length || segments.length > 3) return null
  if (!segments.every((s) => SLUG.test(s) && s.length <= 40)) return null
  if (RESERVED_SLUGS.includes(segments[0])) return null
  const path = `/${segments.join('/')}`
  return path.length >= 6 ? path : null
}

export function resolveAdminPath(raw) {
  if (!raw) return DEFAULT_ADMIN_PATH
  const path = normalizeAdminPath(raw)
  if (!path) throw new Error(`VITE_ADMIN_PATH «${raw}» недопустим: латиница/цифры/дефис, 6+ символов, не служебный адрес`)
  return path
}
