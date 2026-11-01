<script setup>
import BouquetCard from './BouquetCard.vue'
import { bouquets } from '../data/catalog.js'

const variantFor = (i) => (i === 0 ? 'feature' : i === 3 ? 'wide' : 'default')
</script>

<template>
  <section id="bouquets" class="bouquets wrap" aria-labelledby="bouquets-title">
    <header class="bouquets__head">
      <h2 id="bouquets-title" v-reveal>Наши букеты</h2>
      <p v-reveal="80">Каждый - в стаканчике с семечком на дне. Какое семечко положить, выбираете вы.</p>
    </header>

    <ul class="bouquets__grid">
      <li v-for="(b, i) in bouquets" :key="b.slug" v-reveal="i * 70" :class="`slot slot--${variantFor(i)}`">
        <BouquetCard :bouquet="b" :variant="variantFor(i)" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.bouquets {
  padding-block: var(--space-3xl);
}

.bouquets__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: end;
  gap: var(--space-md) var(--space-xl);
  margin-bottom: var(--space-xl);
}

.bouquets__head h2 {
  font-size: var(--text-display);
  font-weight: 400;
}

.bouquets__head p {
  max-width: 30ch;
  color: var(--color-ink-muted);
}

.bouquets__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-xl) var(--space-md);
}

.slot--feature {
  grid-column: span 2;
  grid-row: span 2;
}

.slot--wide {
  grid-column: span 2;
}

@media (max-width: 56rem) {
  .bouquets {
    padding-block: var(--space-2xl);
  }

  .bouquets__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .slot--feature {
    grid-row: auto;
  }
}
</style>
