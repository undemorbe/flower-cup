import { describe, it, expect } from 'vitest'
import { validate, validateItem, validateContent, crossCheck, publicView, specs, t, isCollection } from '../shared/schema.js'
import { content } from './helpers.js'

describe('validate: очистка ввода', () => {
  it('обрезает пробелы и схлопывает внутренние', () => {
    expect(validate(t.str(), '  a   b  ').value).toBe('a b')
  })

  it('вычищает управляющие и bidi-символы', () => {
    expect(validate(t.str(), 'a\u0000b\u202Ec\u200Bd').value).toBe('abcd')
  })

  it('в многострочных полях сохраняет переносы, нормализует \\r\\n', () => {
    expect(validate(t.text(), 'one\r\n\r\ntwo  ').value).toBe('one\n\ntwo')
  })

  it('отбрасывает неизвестные ключи, в т.ч. __proto__', () => {
    const raw = JSON.parse('{"q":"Вопрос","a":"Ответ","id":"q1","evil":1,"__proto__":{"x":1}}')
    const r = validateItem('faq', raw)
    expect(r.ok).toBe(true)
    expect(Object.keys(r.value).sort()).toEqual(['a', 'id', 'published', 'q'])
    expect({}.x).toBeUndefined()
  })

  it('проверяет длину, формат и зарезервированные адреса', () => {
    expect(validate(t.str({ max: 3 }), 'abcd').ok).toBe(false)
    expect(validateItem('pages', { ...content().pages[0], slug: 'Bad Slug' }).ok).toBe(false)
    expect(validateItem('pages', { ...content().pages[0], slug: 'admin' }).ok).toBe(false)
  })

  it('числа: строки с запятой, границы, целые, nullable', () => {
    expect(validate(t.num(), '1,5').value).toBe(1.5)
    expect(validate(t.num({ min: 0 }), -1).ok).toBe(false)
    expect(validate(t.num({ int: true }), 1.5).ok).toBe(false)
    expect(validate(t.num(), Infinity).ok).toBe(false)
    expect(validate(t.num({ nullable: true }), '').value).toBeNull()
  })

  it('bool не принимает строки, пустое -> default', () => {
    expect(validate(t.bool(), 'true').ok).toBe(false)
    expect(validate(t.bool({ default: true }), undefined).value).toBe(true)
  })

  it('список: лимиты min/max', () => {
    expect(validate(t.list(t.str(), { max: 2 }), ['a', 'b', 'c']).ok).toBe(false)
    expect(validate(t.list(t.str(), { min: 1 }), []).ok).toBe(false)
  })

  it('union: неизвестный тип блока отклоняется', () => {
    const page = { ...content().pages[0], blocks: [{ type: 'script', text: 'x' }] }
    expect(validateItem('pages', page).ok).toBe(false)
  })

  it('растение: всходы «до» не меньше «от»', () => {
    const plant = { ...content().plants[0], sproutMin: 10, sproutMax: 5 }
    const r = validateItem('plants', plant)
    expect(r.ok).toBe(false)
    expect(r.errors[0].path).toBe('sproutMax')
  })

  it('неизвестная коллекция и прототипные имена', () => {
    expect(isCollection('plants')).toBe(true)
    expect(isCollection('constructor')).toBe(false)
    expect(validateItem('toString', {}).ok).toBe(false)
  })

  it('telegram и email по шаблону', () => {
    expect(validate(specs.site, { ...content().site, telegram: 'bad name!' }).ok).toBe(false)
    expect(validate(specs.site, { ...content().site, email: 'no-at-sign' }).ok).toBe(false)
  })
})

describe('validateContent и crossCheck', () => {
  it('mock-контент проходит схему', () => {
    const r = validateContent(content())
    expect(r.errors).toEqual([])
    expect(r.ok).toBe(true)
  })

  it('не объект -> ошибка', () => {
    expect(validateContent(null).ok).toBe(false)
    expect(validateContent([]).ok).toBe(false)
  })

  it('ловит битые ссылки букет->семечко и QR->цель', () => {
    const c = content()
    c.bouquets[0].seed = 'net-takogo'
    c.qr[0].target = { type: 'plant', slug: 'net-takogo' }
    const errors = crossCheck(c)
    expect(errors.map((e) => e.path)).toEqual(
      expect.arrayContaining([`bouquets.${c.bouquets[0].slug}.seed`, `qr.${c.qr[0].code}.target`]),
    )
  })

  it('ловит повторяющиеся ключи', () => {
    const c = content()
    c.faq.push({ ...c.faq[0] })
    expect(crossCheck(c).some((e) => e.message.includes('Повторяется'))).toBe(true)
  })
})

describe('publicView', () => {
  it('скрывает неопубликованное и всё, что на него ссылается', () => {
    const c = validateContent(content()).value
    const plant = c.plants[0]
    plant.published = false
    const v = publicView(c)
    expect(v.plants.some((p) => p.slug === plant.slug)).toBe(false)
    expect(v.bouquets.some((b) => b.seed === plant.slug)).toBe(false)
    expect(v.qr.some((q) => q.target.slug === plant.slug)).toBe(false)
    expect(v.reviews.every((r) => r.plant !== plant.slug)).toBe(true)
  })

  it('убирает неактивные QR и подписи из админки', () => {
    const c = validateContent(content()).value
    c.qr[0].active = false
    c.qr[1].label = 'секретная пометка'
    const v = publicView(c)
    expect(v.qr.some((q) => q.code === c.qr[0].code)).toBe(false)
    expect(v.qr[0]).toEqual({ code: c.qr[1].code, target: c.qr[1].target, active: true })
  })

  it('QR на главную всегда остаётся', () => {
    const c = validateContent(content()).value
    c.qr.push({ code: 'home', label: '', target: { type: 'home' }, active: true })
    expect(publicView(c).qr.some((q) => q.code === 'home')).toBe(true)
  })
})
