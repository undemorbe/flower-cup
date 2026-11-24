<script setup>
import { computed } from 'vue'
import HeroCup from '../components/HeroCup.vue'
import PageBlocks from '../components/PageBlocks.vue'
import BouquetsSection from '../components/BouquetsSection.vue'
import SeedsSection from '../components/SeedsSection.vue'
import ReviewsSection from '../components/ReviewsSection.vue'
import { useCatalog } from '../content/store.js'
import { useSeo, ld } from '../seo/head.js'

const { site, menuPages, findPage } = useCatalog()

// Крупная фраза из раздела «О нас» - тизер на главной
const teaser = computed(() => findPage('about')?.blocks.filter((b) => b.type === 'statement').slice(0, 1) ?? [])

const tiles = computed(() => [
  ...menuPages.value.map((p) => ({ to: { name: 'page', params: { slug: p.slug } }, label: p.menuLabel, text: p.lead || p.seoDescription || '' })),
  { to: { name: 'faq' }, label: 'Вопросы', text: 'Про воду, уход, семена и заказ.' },
  { to: { name: 'reviews' }, label: 'Отзывы', text: 'Что говорят о стаканчиках.' },
  { to: { name: 'contacts' }, label: 'Контакты', text: 'Telegram, телефон, доставка.' },
])

useSeo(() => ({
  title: '',
  description: site.value.seoDescription,
  path: '/',
  jsonLd: [ld.organization(site.value)],
}))
</script>

<template>
  <HeroCup />
  <PageBlocks v-if="teaser.length" class="home-teaser" :blocks="teaser" />
  <BouquetsSection />
  <SeedsSection :limit="4" />
  <ReviewsSection :limit="3" />

  <section class="tiles wrap" aria-labelledby="tiles-title">
    <h2 id="tiles-title" class="tiles__title">Ещё о Flower Cup</h2>
    <ul class="tiles__grid">
      <li v-for="t in tiles" :key="t.label">
        <RouterLink class="tile" :to="t.to">
          <span class="tile__label">{{ t.label }}</span>
          <span v-if="t.text" class="tile__text">{{ t.text }}</span>
          <span class="tile__go" aria-hidden="true">→</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.home-teaser {
  padding-bottom: 0;
}

.tiles {
  padding-block: var(--space-3xl);
}

.tiles__title {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-lg);
}

.tiles__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--space-sm);
}

.tile {
  position: relative;
  display: grid;
  gap: var(--space-3xs);
  min-height: 7rem;
  align-content: end;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-paper-2);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--dur-base) var(--ease-out);
}

.tile:hover {
  background: var(--color-peach);
}

.tile__label {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.1;
}

.tile__text {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  padding-right: var(--space-lg);
}

.tile__go {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  transition: transform var(--dur-base) var(--ease-out);
}

.tile:hover .tile__go {
  transform: translateX(3px);
}

@media (max-width: 47.99rem) {
  .tiles {
    padding-block: var(--space-2xl);
  }
}
</style>
