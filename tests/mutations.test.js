import { describe, it, expect } from 'vitest'
import { applyChange } from '../shared/mutations.js'
import { validateContent } from '../shared/schema.js'
import { clone } from '../shared/clone.js'
import { content } from './helpers.js'

const base = () => validateContent(content()).value

describe('applyChange', () => {
  it('не меняет исходный контент', () => {
    const c = base()
    const before = JSON.stringify(c)
    applyChange(c, { op: 'upsert', collection: 'faq', item: { id: 'new-q', q: 'Вопрос?', a: 'Ответ.' } })
    expect(JSON.stringify(c)).toBe(before)
  })

  it('добавляет запись', () => {
    const r = applyChange(base(), { op: 'upsert', collection: 'faq', item: { id: 'new-q', q: 'Вопрос?', a: 'Ответ.' } })
    expect(r.ok).toBe(true)
    expect(r.content.faq.at(-1).id).toBe('new-q')
  })

  it('не даёт занять существующий адрес', () => {
    const c = base()
    const r = applyChange(c, { op: 'upsert', collection: 'faq', item: { ...c.faq[1], id: c.faq[0].id }, originalKey: c.faq[1].id })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(409)
  })

  it('422 на невалидные поля', () => {
    const r = applyChange(base(), { op: 'upsert', collection: 'faq', item: { id: 'x', q: '', a: 'a' } })
    expect(r).toMatchObject({ ok: false, status: 422 })
  })

  it('переименование растения обновляет букеты, отзывы и QR', () => {
    const c = base()
    const old = c.bouquets[0].seed
    const plant = c.plants.find((p) => p.slug === old)
    const r = applyChange(c, { op: 'upsert', collection: 'plants', originalKey: old, item: { ...plant, slug: 'novoe-imya' } })
    expect(r.ok).toBe(true)
    expect(r.content.bouquets.filter((b) => b.seed === old)).toEqual([])
    expect(r.content.bouquets[0].seed).toBe('novoe-imya')
    expect(r.content.qr.some((q) => q.target.type === 'plant' && q.target.slug === old)).toBe(false)
    expect(r.content.qr.some((q) => q.target.slug === 'novoe-imya')).toBe(true)
  })

  it('удаление записи, на которую ссылаются, -> 409', () => {
    const c = base()
    const r = applyChange(c, { op: 'remove', collection: 'plants', key: c.bouquets[0].seed })
    expect(r).toMatchObject({ ok: false, status: 409 })
  })

  it('удаление свободной записи', () => {
    const c = base()
    const r = applyChange(c, { op: 'remove', collection: 'faq', key: c.faq[0].id })
    expect(r.ok).toBe(true)
    expect(r.content.faq).toHaveLength(c.faq.length - 1)
  })

  it('порядок: только перестановка текущих ключей', () => {
    const c = base()
    const keys = c.faq.map((f) => f.id)
    const r = applyChange(c, { op: 'reorder', collection: 'faq', keys: [...keys].reverse() })
    expect(r.content.faq.map((f) => f.id)).toEqual([...keys].reverse())
    expect(applyChange(c, { op: 'reorder', collection: 'faq', keys: keys.slice(1) }).status).toBe(422)
    expect(applyChange(c, { op: 'reorder', collection: 'faq', keys: [keys[0], ...keys.slice(0, -1)] }).status).toBe(422)
  })

  it('настройки сайта проходят схему', () => {
    const c = base()
    expect(applyChange(c, { op: 'site', site: { ...c.site, name: 'Новое' } }).content.site.name).toBe('Новое')
    expect(applyChange(c, { op: 'site', site: { ...c.site, telegram: '<script>' } }).status).toBe(422)
  })

  it('неизвестные операции и коллекции', () => {
    expect(applyChange(base(), { op: 'drop' }).status).toBe(400)
    expect(applyChange(base(), null).status).toBe(400)
    expect(applyChange(base(), { op: 'remove', collection: '__proto__', key: 'x' }).status).toBe(404)
  })

  it('clone не ломается на undefined', () => {
    expect(clone(undefined)).toBeUndefined()
    expect(clone({ a: [1] })).toEqual({ a: [1] })
  })
})
