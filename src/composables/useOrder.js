import { reactive, watch, computed } from 'vue'
import { findBouquet, findSeed } from '../data/catalog.js'

const KEY = 'flowercup:order'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

// Один заказ на сайт: букет + семечко, которое положим на дно стаканчика
const state = reactive({ bouquet: null, seed: null, ...load() })

watch(state, (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* приватный режим — живём без памяти */
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

  return {
    state,
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
