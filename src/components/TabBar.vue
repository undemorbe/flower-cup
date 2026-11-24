<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { menuOpen } from '../composables/useNav.js'

const route = useRoute()
const active = computed(() => (menuOpen.value ? 'more' : route.meta.tab))

const tabs = [
  { key: 'home', label: 'Главная', to: { name: 'home' }, icon: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z' },
  { key: 'bouquets', label: 'Букеты', to: { name: 'bouquets' }, icon: 'M8 10h8l-1.2 10H9.2zM12 10V6m0 0c-2-2-4-2-5-1 1 1 3 2 5 1Zm0 0c2-2 4-2 5-1-1 1-3 2-5 1Z' },
  { key: 'plants', label: 'Растения', to: { name: 'plants' }, icon: 'M12 20v-8m0 0c0-3-2-5-6-5 0 3 2 5 6 5Zm0 0c0-4 2-7 6-7 0 4-2 7-6 7ZM6 20h12' },
  { key: 'faq', label: 'Вопросы', to: { name: 'faq' }, icon: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z' },
]
</script>

<template>
  <nav class="tabs" aria-label="Основные разделы">
    <RouterLink
      v-for="t in tabs"
      :key="t.key"
      class="tab"
      :class="{ 'is-on': active === t.key }"
      :to="t.to"
      :aria-current="active === t.key ? 'page' : undefined"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="t.icon" /></svg>
      <span>{{ t.label }}</span>
    </RouterLink>
    <button
      class="tab"
      :class="{ 'is-on': active === 'more' }"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="site-index"
      @click="menuOpen = !menuOpen"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9" /></svg>
      <span>Ещё</span>
    </button>
  </nav>
</template>

<style scoped>
.tabs {
  display: none;
}

@media (max-width: 47.99rem) {
  .tabs {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    height: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--color-paper);
    border-top: var(--rule-hair);
  }
}

.tab {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.2rem;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-ink-muted);
  font-size: 0.6875rem;
  font-weight: 500;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: color var(--dur-fast) var(--ease-out);
}

.tab svg {
  width: 1.5rem;
  height: 1.5rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--dur-base) var(--ease-out);
}

.tab.is-on {
  color: var(--color-forest);
}

.tab.is-on svg {
  transform: translateY(-1px);
  stroke-width: 1.9;
}

.tab:active svg {
  transform: scale(0.92);
}
</style>
