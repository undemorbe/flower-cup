<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useOrder } from '../composables/useOrder.js'

const sections = [
  { hash: '#top', label: 'Главная' },
  { hash: '#about', label: 'О нас' },
  { hash: '#cups', label: 'О стаканчиках' },
  { hash: '#bouquets', label: 'Букеты' },
  { hash: '#seeds', label: 'Семечки' },
  { hash: '#contacts', label: 'Контакты' },
]

const open = ref(false)
const scrolled = ref(false)
const trigger = ref(null)
const firstLink = ref(null)
const route = useRoute()
const { bouquet } = useOrder()

const target = (hash) => (hash === '#contacts' ? { hash } : { name: 'home', hash })

watch(open, async (value) => {
  document.documentElement.style.overflow = value ? 'hidden' : ''
  await nextTick()
  if (value) firstLink.value?.[0]?.$el?.focus()
  else trigger.value?.focus()
})
watch(() => route.fullPath, () => (open.value = false))

const onKey = (e) => e.key === 'Escape' && open.value && (open.value = false)
const onScroll = () => (scrolled.value = window.scrollY > 8)
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <header class="head" :class="{ 'is-scrolled': scrolled && !open, 'is-open': open }">
    <div class="wrap head__row">
      <RouterLink class="wordmark" :to="{ name: 'home', hash: '#top' }">Flower Cup</RouterLink>
      <div class="head__end">
        <RouterLink v-if="bouquet" class="head__order" :to="{ hash: '#contacts' }">
          <span class="head__dot" aria-hidden="true"></span>
          <span>В заказе: {{ bouquet.name }}</span>
        </RouterLink>
        <button
          ref="trigger"
          class="head__menu"
          type="button"
          :aria-expanded="open"
          aria-controls="site-index"
          @click="open = !open"
        >
          <span>{{ open ? 'Закрыть' : 'Меню' }}</span>
          <span class="burger" :class="{ 'is-open': open }" aria-hidden="true"><i></i><i></i></span>
        </button>
      </div>
    </div>
  </header>

  <Transition name="sheet">
    <nav v-if="open" id="site-index" class="sheet" aria-label="Разделы сайта">
      <div class="wrap sheet__inner">
        <ol class="sheet__list">
          <li v-for="(s, i) in sections" :key="s.hash" :style="{ '--i': i }">
            <RouterLink ref="firstLink" :to="target(s.hash)" @click="open = false">
              <span class="sheet__n num">{{ i + 1 }}</span>
              <span class="sheet__label">{{ s.label }}</span>
            </RouterLink>
          </li>
        </ol>
        <p class="sheet__note hand">букет, который продолжает жить</p>
      </div>
    </nav>
  </Transition>
</template>

<style scoped>
.head {
  position: sticky;
  top: env(safe-area-inset-top, 0px);
  z-index: 30;
  background: var(--color-paper);
  border-bottom: 1px solid transparent;
  transition: border-color var(--dur-base) var(--ease-out);
}

.head.is-scrolled {
  border-bottom-color: var(--color-rule);
}

.head.is-open {
  z-index: 45;
  background: transparent;
  color: var(--color-on-forest);
}

.head.is-open .head__order {
  visibility: hidden;
}

.head__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  min-height: 4.25rem;
}

.wordmark {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
}

.head__end {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.head__order {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.head__order:hover {
  color: var(--color-ink);
}

.head__dot {
  flex: none;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-accent);
}

.head__menu {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  min-height: 2.75rem;
  padding: 0 var(--space-sm);
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-pill);
  background: transparent;
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.head__menu:hover {
  background: var(--color-ink);
  color: var(--color-paper);
}

.head__menu[aria-expanded='true'] {
  border-color: var(--color-on-forest);
  color: var(--color-on-forest);
}

.head__menu[aria-expanded='true']:hover {
  background: var(--color-on-forest);
  color: var(--color-forest-deep);
}

.burger {
  display: grid;
  gap: 4px;
  width: 16px;
}

.burger i {
  display: block;
  height: 1.5px;
  background: currentColor;
  transition: transform var(--dur-base) var(--ease-out);
}

.burger.is-open i:first-child {
  transform: translateY(2.75px) rotate(45deg);
}

.burger.is-open i:last-child {
  transform: translateY(-2.75px) rotate(-45deg);
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow-y: auto;
  background: var(--color-forest);
  color: var(--color-on-forest);
  padding-top: calc(5.5rem + env(safe-area-inset-top, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sheet__inner {
  display: grid;
  gap: var(--space-xl);
  padding-block: var(--space-lg) var(--space-2xl);
}

.sheet__list li {
  border-top: 1px solid var(--color-forest-rule);
}

.sheet__list li:last-child {
  border-bottom: 1px solid var(--color-forest-rule);
}

.sheet__list a {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  padding-block: var(--space-xs);
  text-decoration: none;
}

.sheet__n {
  width: 2ch;
  font-size: var(--text-sm);
  color: var(--color-on-forest-muted);
}

.sheet__label {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  line-height: 1.05;
  transition: transform var(--dur-base) var(--ease-out), color var(--dur-fast) var(--ease-out);
}

.sheet__list a:hover .sheet__label,
.sheet__list a:focus-visible .sheet__label {
  transform: translateX(0.4rem);
  color: var(--color-peach);
}

.sheet__note {
  font-size: var(--text-xl);
  color: var(--color-kraft);
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--dur-base) var(--ease-out);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .sheet__list li {
  transition: transform var(--dur-slow) var(--ease-out), opacity var(--dur-slow) var(--ease-out);
  transition-delay: calc(var(--i) * 40ms);
}

.sheet-enter-from .sheet__list li {
  transform: translateY(12px);
  opacity: 0;
}

@media (max-width: 40rem) {
  .head__order span:last-child {
    display: none;
  }
}
</style>
