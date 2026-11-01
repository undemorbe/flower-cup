import { reactive, watch, computed } from 'vue'
import { findBouquet, findSeed, formatPrice } from '../data/catalog.js'
import { telegramLink } from '../data/site.js'

const KEY = 'flowercup:order'

// localStorage может подменить кто угодно - принимаем только известные слаги
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    return {
      bouquet: findBouquet(raw?.bouquet) ? raw.bouquet : null,
      seed: findSeed(raw?.seed) ? raw.seed : null,
    }
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

export function useOrder() {
  const bouquet = computed(() => (state.bouquet ? findBouquet(state.bouquet) : null))
  const seed = computed(() => (state.seed ? findSeed(state.seed) : null))

  const summary = computed(() => {
    if (!bouquet.value) return ''
    const parts = [`Букет «${bouquet.value.name}»`]
    if (seed.value) parts.push(`семечко: ${seed.value.name.toLowerCase()}`)
    return parts.join(', ')
  })

  // Ссылка в Telegram с готовым текстом заказа
  const orderText = computed(() =>
    bouquet.value ? `Здравствуйте! Хочу заказать: ${summary.value} (${formatPrice(bouquet.value.price)}).` : '',
  )
  const telegramUrl = computed(() => telegramLink(orderText.value))

  return {
    state,
    orderText,
    telegramUrl,
    bouquet,
    seed,
    summary,
    setBouquet: (slug) => (state.bouquet = slug),
    setSeed: (slug) => (state.seed = slug),
    clear: () => {
      state.bouquet = null
      state.seed = null
    },
  }
}
