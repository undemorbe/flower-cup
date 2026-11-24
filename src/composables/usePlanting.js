// «Я посадил(а)»: дата посадки по каждому растению хранится только в этом браузере
import { reactive, computed } from 'vue'
import { SLUG } from '../../shared/schema.js'
import { plantingStatus } from '../../shared/format.js'

const KEY = 'flowercup:planted'
const MIN_TS = Date.UTC(2024, 0, 1)

// Чужие или битые записи отбрасываем: ключ - слаг, значение - разумная дата в прошлом
export function parsePlanted(raw, now = Date.now()) {
  const out = {}
  try {
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return out
    for (const [slug, ts] of Object.entries(data)) {
      if (SLUG.test(slug) && Number.isFinite(ts) && ts >= MIN_TS && ts <= now + 60_000) out[slug] = ts
    }
  } catch {
    /* пусто */
  }
  return out
}

let store = null
function getStore() {
  if (store) return store
  let initial = {}
  try {
    initial = parsePlanted(localStorage.getItem(KEY))
  } catch {
    /* SSR или приватный режим */
  }
  store = reactive(initial)
  return store
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* без памяти */
  }
}

export function usePlanting(plantRef) {
  const planted = getStore()
  const sownAt = computed(() => (plantRef.value ? planted[plantRef.value.slug] ?? null : null))
  const status = computed(() => plantingStatus(plantRef.value, sownAt.value))
  return {
    sownAt,
    status,
    plantToday() {
      planted[plantRef.value.slug] = Date.now()
      persist()
    },
    reset() {
      delete planted[plantRef.value.slug]
      persist()
    },
  }
}
