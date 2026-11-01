<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useOrder } from '../composables/useOrder.js'
import { formatPrice } from '../data/catalog.js'

const { state, bouquet, seed } = useOrder()
const footerVisible = ref(false)
const undo = ref(null) // снимок заказа для «Вернуть»
let undoTimer = 0
let io

function remove() {
  undo.value = { bouquet: state.bouquet, seed: state.seed }
  state.bouquet = null
  state.seed = null
  clearTimeout(undoTimer)
  undoTimer = setTimeout(() => (undo.value = null), 6000)
}

function restore() {
  Object.assign(state, undo.value)
  undo.value = null
}

onMounted(() => {
  const footer = document.getElementById('contacts')
  if (!footer) return
  io = new IntersectionObserver(([e]) => (footerVisible.value = e.isIntersecting))
  io.observe(footer)
})
onBeforeUnmount(() => {
  io?.disconnect()
  clearTimeout(undoTimer)
})
</script>

<template>
  <Transition name="bar">
    <aside v-if="(bouquet || undo) && !footerVisible" class="bar" aria-live="polite">
      <template v-if="bouquet">
        <p class="bar__what">
          <span class="bar__label">В стаканчике:</span>
          {{ bouquet.name }}<template v-if="seed"> + {{ seed.name.toLowerCase() }}</template>
          <span class="num"> · {{ formatPrice(bouquet.price) }}</span>
        </p>
        <button class="bar__remove" type="button" @click="remove">Убрать</button>
        <RouterLink class="btn btn--light" :to="{ hash: '#contacts' }">Оформить</RouterLink>
      </template>
      <template v-else>
        <p class="bar__what">Заказ убран.</p>
        <button class="bar__remove" type="button" @click="restore">Вернуть</button>
      </template>
    </aside>
  </Transition>
</template>

<style scoped>
.bar {
  position: fixed;
  left: 50%;
  bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
  z-index: 25;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: max-content;
  max-width: calc(100% - 2 * var(--page-gutter));
  padding: var(--space-2xs) var(--space-2xs) var(--space-2xs) var(--space-md);
  border-radius: var(--radius-pill);
  background: var(--color-forest-deep);
  color: var(--color-on-forest);
  transform: translateX(-50%);
}

.bar__what {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
}

.bar__label {
  color: var(--color-on-forest-muted);
}

.bar__remove {
  border: 0;
  background: none;
  padding: var(--space-2xs) 0;
  font-size: var(--text-sm);
  color: var(--color-on-forest-muted);
  text-decoration: underline;
  text-underline-offset: 0.25em;
  white-space: nowrap;
}

.bar__remove:hover {
  color: var(--color-on-forest);
}

.bar .btn {
  min-height: 2.5rem;
}

.bar > :last-child:not(.btn) {
  padding-right: var(--space-sm);
}

.bar-enter-active,
.bar-leave-active {
  transition:
    opacity var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}

.bar-enter-from,
.bar-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

@media (max-width: 30rem) {
  .bar__label {
    display: none;
  }
}
</style>
