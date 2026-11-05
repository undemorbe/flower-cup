<script setup>
import { faq } from '../data/faq.js'
import { site } from '../data/site.js'
</script>

<template>
  <section id="faq" class="faq wrap" aria-labelledby="faq-title">
    <header class="faq__head">
      <h2 id="faq-title" v-reveal>Вопросы</h2>
      <p v-reveal="80">
        Не нашли ответ - спросите в
        <a class="link" :href="`https://t.me/${site.telegram}`" target="_blank" rel="noopener">Telegram</a>.
      </p>
    </header>

    <div class="faq__list">
      <details v-for="item in faq" :key="item.q" v-reveal class="qa" name="faq">
        <summary class="qa__q">
          <span>{{ item.q }}</span>
          <svg class="qa__icon" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h12" />
            <path class="qa__icon-v" d="M10 4v12" />
          </svg>
        </summary>
        <p class="qa__a">{{ item.a }}</p>
      </details>
    </div>
  </section>
</template>

<style scoped>
.faq {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
  gap: var(--space-2xl);
  align-items: start;
  padding-block: var(--space-3xl);
}

.faq__head {
  position: sticky;
  top: 6rem;
  display: grid;
  gap: var(--space-md);
}

.faq__head h2 {
  font-size: var(--text-4xl);
  font-weight: 400;
}

.faq__head p {
  max-width: 30ch;
  color: var(--color-ink-muted);
}

.faq__list {
  border-bottom: var(--rule-hair);
}

.qa {
  border-top: var(--rule-hair);
}

.qa__q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding-block: var(--space-md);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.15;
  list-style: none;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);
}

.qa__q::-webkit-details-marker {
  display: none;
}

.qa__q:hover {
  color: var(--color-accent-ink);
}

.qa__icon {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
}

.qa__icon-v {
  transform-origin: center;
  transition: transform var(--dur-base) var(--ease-out);
}

.qa[open] .qa__icon-v {
  transform: rotate(90deg);
}

.qa__a {
  max-width: 60ch;
  padding-bottom: var(--space-md);
  color: var(--color-ink-muted);
}

@media (max-width: 56rem) {
  .faq {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-lg);
    padding-block: var(--space-2xl);
  }

  .faq__head {
    position: static;
  }

  .qa__q {
    font-size: var(--text-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .qa__icon-v {
    transition: none;
  }
}
</style>
