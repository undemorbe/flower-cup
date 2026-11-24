import { describe, it, expect } from 'vitest'
import { formatPrice, sproutLabel, qrTargetPath, telegramLink, plantingStatus, plural } from '../shared/format.js'

const DAY = 86_400_000

describe('format', () => {
  it('formatPrice', () => {
    expect(formatPrice(null)).toBe('Цена уточняется')
    expect(formatPrice(1500)).toBe('1500 ₽')
  })

  it('sproutLabel', () => {
    expect(sproutLabel({ sproutMin: 5, sproutMax: 5 })).toBe('5 дн.')
    expect(sproutLabel({ sproutMin: 5, sproutMax: 10 })).toBe('5–10 дней')
  })

  it('qrTargetPath: только внутренние пути', () => {
    expect(qrTargetPath({ type: 'plant', slug: 'bazilik' })).toBe('/plants/bazilik')
    expect(qrTargetPath({ type: 'bouquet', slug: 'b' })).toBe('/bouquets/b')
    expect(qrTargetPath({ type: 'page', slug: 'about' })).toBe('/about')
    expect(qrTargetPath({ type: 'url', slug: 'https://evil.example' })).toBe('/')
    expect(qrTargetPath(undefined)).toBe('/')
    expect(qrTargetPath({ type: 'page', slug: '/evil.example' })).toBe('/')
    expect(qrTargetPath({ type: 'page' })).toBe('/')
    expect(qrTargetPath({ type: 'plant', slug: '../admin' })).toBe('/')
    expect(qrTargetPath({ type: 'home' })).toBe('/')
  })

  it('telegramLink кодирует текст', () => {
    expect(telegramLink('flowercup', 'a&b c')).toBe('https://t.me/flowercup?text=a%26b%20c')
    expect(telegramLink('flowercup')).toBe('https://t.me/flowercup')
  })

  it('plantingStatus: стадии', () => {
    const plant = { sproutMin: 5, sproutMax: 10 }
    const now = Date.UTC(2026, 5, 20)
    expect(plantingStatus(plant, null, now)).toBeNull()
    expect(plantingStatus(plant, now - 2 * DAY, now)).toMatchObject({ day: 2, stage: 'waiting', daysToMin: 3 })
    expect(plantingStatus(plant, now - 7 * DAY, now)).toMatchObject({ day: 7, stage: 'sprouting', daysToMin: 0 })
    expect(plantingStatus(plant, now - 30 * DAY, now)).toMatchObject({ stage: 'late', progress: 1 })
    expect(plantingStatus(plant, now + DAY, now).day).toBe(0)
  })

  it('plural', () => {
    const f = ['день', 'дня', 'дней']
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map((n) => plural(n, f))).toEqual([
      'день', 'дня', 'дней', 'дней', 'дней', 'день', 'дня', 'дней', 'дней',
    ])
  })
})
