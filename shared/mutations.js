// Изменения контента из админки. Чистые функции: принимают контент, возвращают новый
// или ошибки. Используются и бэкендом, и демо-режимом админки (без бэкенда).
import { COLLECTIONS, isCollection, validateItem, validate, specs, validateContent } from './schema.js'
import { clone } from './clone.js'

const fail = (status, error, details = []) => ({ ok: false, status, error, details })
const done = (content) => ({ ok: true, content })

// После любого изменения весь контент проходит полную проверку, включая ссылки
function finish(content) {
  const r = validateContent(content)
  return r.ok ? done(r.value) : fail(409, 'Изменение нарушает связи между данными', r.errors)
}

// Переименовали растение/букет/раздел - обновляем ссылки на него
function renameRefs(content, collection, from, to) {
  if (from === to) return content
  const c = clone(content)
  const qrType = { plants: 'plant', bouquets: 'bouquet', pages: 'page' }[collection]
  if (collection === 'plants') {
    c.bouquets.forEach((b) => b.seed === from && (b.seed = to))
    c.reviews.forEach((r) => r.plant === from && (r.plant = to))
  }
  if (collection === 'bouquets') c.reviews.forEach((r) => r.bouquet === from && (r.bouquet = to))
  if (qrType) c.qr.forEach((q) => q.target.type === qrType && q.target.slug === from && (q.target.slug = to))
  return c
}

export function upsertItem(content, collection, originalKey, item) {
  if (!isCollection(collection)) return fail(404, 'Неизвестный раздел данных')
  const checked = validateItem(collection, item)
  if (!checked.ok) return fail(422, 'Проверьте поля', checked.errors)
  const { key } = COLLECTIONS[collection]
  const next = checked.value
  const list = content[collection]
  const at = originalKey ? list.findIndex((x) => x[key] === originalKey) : -1
  if (originalKey && at < 0) return fail(404, 'Запись не найдена - возможно, её уже удалили')
  if (list.some((x, i) => i !== at && x[key] === next[key])) {
    return fail(409, `Адрес «${next[key]}» уже занят`, [{ path: key, message: 'Такой адрес уже есть' }])
  }
  let c = clone(content)
  if (at >= 0) c[collection][at] = next
  else c[collection].push(next)
  if (at >= 0) c = renameRefs(c, collection, originalKey, next[key])
  return finish(c)
}

export function removeItem(content, collection, key) {
  if (!isCollection(collection)) return fail(404, 'Неизвестный раздел данных')
  const k = COLLECTIONS[collection].key
  if (!content[collection].some((x) => x[k] === key)) return fail(404, 'Запись не найдена')
  const c = clone(content)
  c[collection] = c[collection].filter((x) => x[k] !== key)
  const r = finish(c)
  if (!r.ok) return fail(409, 'Нельзя удалить: на запись ссылаются другие данные', r.details)
  return r
}

export function reorderItems(content, collection, keys) {
  if (!isCollection(collection)) return fail(404, 'Неизвестный раздел данных')
  const k = COLLECTIONS[collection].key
  const list = content[collection]
  const same = Array.isArray(keys) && keys.length === list.length && new Set(keys).size === keys.length && keys.every((key) => list.some((x) => x[k] === key))
  if (!same) return fail(422, 'Порядок не совпадает с текущим списком - обновите страницу')
  const c = clone(content)
  c[collection] = keys.map((key) => list.find((x) => x[k] === key))
  return done(c)
}

export function updateSite(content, site) {
  const checked = validate(specs.site, site)
  if (!checked.ok) return fail(422, 'Проверьте поля', checked.errors)
  return finish({ ...clone(content), site: checked.value })
}

// Одна точка входа для API и демо-режима
export function applyChange(content, change) {
  switch (change?.op) {
    case 'upsert':
      return upsertItem(content, change.collection, change.originalKey ?? null, change.item)
    case 'remove':
      return removeItem(content, change.collection, change.key)
    case 'reorder':
      return reorderItems(content, change.collection, change.keys)
    case 'site':
      return updateSite(content, change.site)
    default:
      return fail(400, 'Неизвестная операция')
  }
}
