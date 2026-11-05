<script setup>
import { reviews } from '../data/reviews.js'
import { findBouquet, findSeed } from '../data/catalog.js'

const items = reviews.map((r) => ({
  ...r,
  bouquet: r.bouquet ? findBouquet(r.bouquet) : null,
  seed: r.seed ? findSeed(r.seed) : null,
}))
</script>

<template>
  <section v-if="items.length" id="reviews" class="reviews" aria-labelledby="reviews-title">
    <div class="wrap">
      <h2 id="reviews-title" v-reveal class="reviews__title">Отзывы</h2>
      <ul class="reviews__list">
        <li v-for="(r, i) in items" :key="r.name + i" v-reveal="(i % 3) * 80" class="review">
          <blockquote class="review__text">
            <p>{{ r.text }}</p>
          </blockquote>
          <p class="review__who">
            <span class="review__name">{{ r.name }}</span>
            <span v-if="r.bouquet || r.seed" class="review__what">
              <RouterLink v-if="r.bouquet" class="link" :to="{ name: 'bouquet', params: { slug: r.bouquet.slug } }">
                {{ r.bouquet.name }}
              </RouterLink>
              <template v-if="r.bouquet && r.seed"> + </template>
              <RouterLink v-if="r.seed" class="link" :to="{ name: 'seed', params: { slug: r.seed.slug } }">
                {{ r.bouquet ? r.seed.name.toLowerCase() : r.seed.name }}
              </RouterLink>
            </span>
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.reviews {
  padding-block: var(--space-3xl) 0;
}

.reviews__title {
  font-size: var(--text-4xl);
  font-weight: 400;
  margin-bottom: var(--space-xl);
}

.reviews__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-md);
}

.review {
  display: grid;
  align-content: space-between;
  gap: var(--space-lg);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-paper-2);
}

.review__text {
  margin: 0;
}

.review__text p {
  font-size: var(--text-md);
  line-height: 1.55;
}

.review__who {
  display: grid;
  gap: var(--space-3xs);
  font-size: var(--text-sm);
}

.review__name {
  font-weight: 500;
}

.review__what {
  color: var(--color-ink-muted);
}

@media (max-width: 56rem) {
  .reviews {
    padding-block: var(--space-2xl) 0;
  }

  .review {
    padding: var(--space-md);
  }
}
</style>
