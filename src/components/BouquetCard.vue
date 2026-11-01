<script setup>
import BouquetArt from './art/BouquetArt.vue'
import { formatPrice } from '../data/catalog.js'

defineProps({
  bouquet: { type: Object, required: true },
  variant: { type: String, default: 'default' }, // default | feature | wide
})
</script>

<template>
  <RouterLink class="card" :class="`card--${variant}`" :to="{ name: 'bouquet', params: { slug: bouquet.slug } }">
    <div class="card__art">
      <BouquetArt :art="bouquet.art" :label="`Букет «${bouquet.name}»`" />
    </div>
    <div class="card__meta">
      <span class="card__size">{{ bouquet.size }}</span>
      <span class="card__name">{{ bouquet.name }}</span>
      <span class="card__price num">{{ formatPrice(bouquet.price) }}</span>
      <p v-if="variant !== 'default'" class="card__lead">{{ bouquet.lead }}</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: grid;
  gap: var(--space-sm);
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.card__art {
  display: grid;
  place-items: end center;
  aspect-ratio: 4 / 4.4;
  padding: var(--space-md) var(--space-md) 0;
  border-radius: var(--radius-md);
  background: var(--color-linen);
  overflow: hidden;
  transition: background-color var(--dur-base) var(--ease-out);
}

.card__art svg {
  width: 100%;
  max-width: 17rem;
  height: auto;
  transform-origin: 50% 100%;
  transition: transform var(--dur-slow) var(--ease-out);
}

.card:hover .card__art {
  background: var(--color-peach);
}

.card:hover .card__art svg {
  transform: translateY(-4px) rotate(-1.5deg);
}

.card__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0 var(--space-sm);
  align-items: baseline;
}

.card__size {
  grid-column: 1 / -1;
  font-size: var(--text-xs);
  color: var(--color-accent-ink);
}

.card__name {
  font-size: var(--text-md);
  font-weight: 500;
  min-width: 0;
}

.card:hover .card__name {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}

.card__price {
  font-size: var(--text-md);
  white-space: nowrap;
}

.card__lead {
  grid-column: 1 / -1;
  margin-top: var(--space-2xs);
  max-width: 36ch;
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
}

.card--feature .card__art {
  aspect-ratio: auto;
  flex: 1;
  min-height: 24rem;
}

.card--feature {
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100%;
}

.card--feature .card__art svg {
  max-width: 26rem;
}

.card--feature .card__name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
}

.card--wide {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: end;
  gap: var(--space-lg);
}

.card--wide .card__art {
  aspect-ratio: 4 / 3.6;
}

.card--wide .card__meta {
  padding-bottom: var(--space-sm);
}

.card--feature .card__meta,
.card--wide .card__meta {
  grid-template-columns: minmax(0, 1fr);
}

.card--wide .card__name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
}

@media (max-width: 40rem) {
  .card--wide {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-sm);
  }

  .card--feature .card__art {
    min-height: 0;
    aspect-ratio: 4 / 4.4;
  }
}
</style>
