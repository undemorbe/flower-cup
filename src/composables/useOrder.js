import { reactive, watch, computed } from 'vue'
import { SLUG } from '../../shared/schema.js'
import { formatPrice, telegramLink } from '../../shared/format.js'
import { useCatalog, state as contentState } from '../content/store.js'

const KEY = 'flowercup:order'

// localStorage может подменить кто угодно: берём только строки-слаги.
// Есть ли такой букет, решает каталог (он может прийти из API позже).
export function parseOrder(raw) {
  try {
    const data = JSON.parse(raw)
    const ok = (v) => (typeof v === 'string' && SLUG.test(v) && v.length <= 60 ? v : null)
    return { bouquet: ok(data?.bouquet), seed: ok(data?.seed) }
  } catch {
    return { bouquet: null, seed: null }
  }
}

function load() {
  try {
    return parseOrder(localStorage.getItem(KEY))
  } catch {
    return { bouquet: null, seed: null }
  }
}

// Один заказ на сайт: букет + семечко, которое положим на дно стаканчика
const state = reactive(load())

watch(state, (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* приватный режим - живём без памяти */
  }
})

export function orderMessage(bouquet, seed) {
  if (!bouquet) return ''
  const parts = [`Букет «${bouquet.name}»`]
  if (seed) parts.push(`семечко: ${seed.name.toLowerCase()}`)
  return `Здравствуйте! Хочу заказать: ${parts.join(', ')} (${formatPrice(bouquet.price)}).`
}

export function useOrder() {
  const { findBouquet, findPlant } = useCatalog()
  const bouquet = computed(() => (state.bouquet ? findBouquet(state.bouquet) : null))
  const seed = computed(() => (state.seed ? findPlant(state.seed) : null))

  const orderText = computed(() => orderMessage(bouquet.value, seed.value))
  const telegramUrl = computed(() => telegramLink(contentState.content.site.telegram, orderText.value))

  return {
    state,
    orderText,
    telegramUrl,
    bouquet,
    seed,
    setBouquet: (slug) => (state.bouquet = slug),
    setSeed: (slug) => (state.seed = slug),
    clear: () => {
      state.bouquet = null
      state.seed = null
    },
  }
}
