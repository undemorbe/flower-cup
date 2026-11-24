<script setup>
import BouquetCard from './BouquetCard.vue'
import { useCatalog } from '../content/store.js'

// asPage - отдельная страница «Букеты» (заголовок h1), иначе - блок на главной со ссылкой
defineProps({ asPage: { type: Boolean, default: false } })
const { bouquets } = useCatalog()

const variantFor = (i) => (i === 0 ? 'feature' : i === 3 ? 'wide' : 'default')
</script>

<template>
  <section class="bouquets wrap" :class="{ 'bouquets--page': asPage }" aria-labelledby="bouquets-title">
    <header class="bouquets__head">
      <component :is="asPage ? 'h1' : 'h2'" id="bouquets-title" v-reveal>Наши букеты</component>
      <p v-reveal="80">
        Каждый - в стаканчике с семечком на дне. Какое семечко положить, выбираете вы.
        <RouterLink v-if="!asPage" class="link" :to="{ name: 'bouquets' }">Все букеты</RouterLink>
      </p>
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

.bouquets--page {
  padding-top: var(--space-xl);
}

.bouquets__head h1,
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
