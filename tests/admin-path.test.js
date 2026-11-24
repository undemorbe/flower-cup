import { describe, it, expect } from 'vitest'
import { normalizeAdminPath, resolveAdminPath, DEFAULT_ADMIN_PATH } from '../shared/admin-path.js'

describe('адрес админки', () => {
  it('по умолчанию не /admin', () => {
    expect(resolveAdminPath('')).toBe(DEFAULT_ADMIN_PATH)
    expect(DEFAULT_ADMIN_PATH).not.toBe('/admin')
  })

  it('нормализует слэши и регистр', () => {
    expect(normalizeAdminPath('/Kabinet-x7/')).toBe('/kabinet-x7')
    expect(normalizeAdminPath('team/panel-42')).toBe('/team/panel-42')
  })

  it('отклоняет служебные, короткие и опасные адреса', () => {
    for (const bad of ['/admin', '/plants/x', '/q/abc', '/ab', '/a b', '/../etc', '/x?y=1', '/<script>', '/a/b/c/d', 'https://evil.example', null]) {
      expect(normalizeAdminPath(bad), String(bad)).toBeNull()
    }
    expect(() => resolveAdminPath('/admin')).toThrow(/VITE_ADMIN_PATH/)
  })
})
