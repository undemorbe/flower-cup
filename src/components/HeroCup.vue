<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import BouquetArt from './art/BouquetArt.vue'
import { useMedia } from '../composables/useMedia.js'
import { findBouquet } from '../data/catalog.js'

// 3D только для ноутбуков/десктопов: широкий экран и точный указатель
const isDesktop = useMedia('(min-width: 64rem) and (pointer: fine)')
const reducedMotion = useMedia('(prefers-reduced-motion: reduce)')

const canvas = ref(null)
const ready = ref(false)
const failed = ref(false)
const planted = ref(false)
const progress = ref(0)
let scene = null
let unsubscribe = null

const poster = findBouquet('podsolnuh').art

async function mount3D() {
  if (scene || !canvas.value) return
  try {
    const { createCupScene } = await import('../three/cupScene.js')
    if (!canvas.value) return
    scene = await createCupScene(canvas.value, { reducedMotion: reducedMotion.value })
    unsubscribe = scene.onProgress((p) => (progress.value = p))
    ready.value = true
  } catch (err) {
    console.warn('3D-сцена недоступна, показываем иллюстрацию', err)
    failed.value = true
  }
}

function teardown() {
  unsubscribe?.()
  scene?.dispose()
  scene = null
  ready.value = false
}

watch([isDesktop, canvas], ([desktop]) => (desktop ? mount3D() : teardown()), { flush: 'post' })
onBeforeUnmount(teardown)

function togglePlant() {
  planted.value = !planted.value
  scene?.setPlanted(planted.value)
}

const stages = ['букет', 'стаканчик в землю', 'росток']
const stageIndex = computed(() => (progress.value < 0.3 ? 0 : progress.value < 0.7 ? 1 : 2))
const show3D = computed(() => isDesktop.value && !failed.value)
</script>

<template>
  <section id="top" class="hero wrap" aria-labelledby="hero-title">
    <div class="hero__copy">
      <h1 id="hero-title" class="hero__title">Букет, который продолжает жить</h1>
      <p class="hero__lead">
        Цветы стоят в крафтовом стаканчике вместо вазы. Когда букет отцветёт, на дне вас ждёт семечко —
        его можно посадить прямо в этот стаканчик.
      </p>
      <div class="hero__actions">
        <RouterLink class="btn" :to="{ hash: '#bouquets' }">Выбрать букет <span class="arrow">→</span></RouterLink>
        <RouterLink class="link" :to="{ hash: '#cups' }">Как это работает</RouterLink>
      </div>
    </div>

    <div class="stage" :class="{ 'is-live': ready }">
      <BouquetArt
        v-if="!show3D || !ready"
        class="stage__poster"
        :art="poster"
        label="Букет с подсолнухом в крафтовом стаканчике"
      />

      <template v-if="show3D">
        <canvas
          ref="canvas"
          class="stage__canvas"
          tabindex="0"
          role="img"
          aria-label="Трёхмерный стаканчик с букетом. Потяните мышью или нажмите стрелки, чтобы повернуть."
        ></canvas>

        <p class="stage__hint hand" aria-hidden="true">
          потяните, чтобы повернуть
          <svg viewBox="0 0 60 40" class="stage__hint-arrow">
            <path d="M4 6 C 22 4, 44 12, 50 32" />
            <path d="M42 28 L50 33 L53 23" />
          </svg>
        </p>

        <div class="stage__controls">
          <button
            class="btn"
            :class="{ 'btn--ghost': planted }"
            type="button"
            :aria-pressed="planted"
            :disabled="!ready"
            @click="togglePlant"
          >
            {{ planted ? 'Вернуть букет' : 'Посадить стаканчик' }}
          </button>
          <ol class="stage__steps" aria-label="Что происходит со стаканчиком">
            <li v-for="(s, i) in stages" :key="s" :class="{ 'is-on': ready && i === stageIndex }">{{ s }}</li>
          </ol>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: var(--space-xl);
  align-items: end;
  padding-block: var(--space-xl) var(--space-3xl);
}

.hero__copy {
  display: grid;
  gap: var(--space-lg);
  padding-bottom: var(--space-xl);
}

.hero__title {
  font-size: var(--text-4xl);
  font-weight: 500;
  line-height: 0.98;
}

.hero__lead {
  max-width: 34ch;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: 1.4;
  color: var(--color-ink-muted);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md) var(--space-lg);
  font-size: var(--text-sm);
  font-weight: 500;
}

.stage {
  position: relative;
  aspect-ratio: 7 / 6.4;
  max-height: 46rem;
  width: 100%;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(120% 80% at 70% 0%, var(--color-peach), transparent 60%),
    var(--color-linen);
  overflow: hidden;
}

.stage__poster {
  position: absolute;
  inset: 8% 14% 0;
  width: 72%;
  height: 92%;
  transition: opacity var(--dur-slow) var(--ease-out);
}

.stage__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  opacity: 0;
  touch-action: pan-y;
  transition: opacity var(--dur-slow) var(--ease-out);
}

.stage__canvas[data-dragging] {
  cursor: grabbing;
}

.stage__canvas:focus-visible {
  outline-offset: -4px;
}

.stage.is-live .stage__canvas {
  opacity: 1;
}

.stage__hint {
  position: absolute;
  top: var(--space-lg);
  left: var(--space-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3xs);
  font-size: var(--text-lg);
  color: var(--color-forest);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out) 600ms;
}

.stage.is-live .stage__hint {
  opacity: 0.85;
}

.stage__hint-arrow {
  width: 3rem;
  margin-top: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.stage__controls {
  position: absolute;
  left: var(--space-lg);
  right: var(--space-lg);
  bottom: var(--space-lg);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-lg);
}

.stage__controls .btn--ghost {
  background: var(--color-paper);
}

.stage__controls .btn--ghost:hover {
  background: var(--color-ink);
}

.stage__steps {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
}

.stage__steps li {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  white-space: nowrap;
  transition: color var(--dur-base) var(--ease-out);
}

.stage__steps li + li::before {
  content: '';
  width: 1.25rem;
  height: 1px;
  background: currentColor;
  opacity: 0.5;
}

.stage__steps li.is-on {
  color: var(--color-ink);
  font-weight: 500;
}

@media (max-width: 63.99rem) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-lg);
    padding-block: var(--space-md) var(--space-2xl);
  }

  .hero__copy {
    padding-bottom: 0;
  }

  .stage {
    aspect-ratio: 1 / 1;
    max-height: none;
  }
}
</style>
