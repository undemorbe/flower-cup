import seed from '../shared/seed-content.json'
import { clone } from '../shared/clone.js'

export const content = () => clone(seed)

// Память вместо localStorage/sessionStorage
export function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    get size() {
      return map.size
    },
  }
}
