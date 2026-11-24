<script setup>
import { computed } from 'vue'
import SeedPacket from './art/SeedPacket.vue'
import { useCatalog } from '../content/store.js'
import { sproutLabel } from '../../shared/format.js'

// asPage - отдельная страница «Растения»; limit - сколько показать на главной
const props = defineProps({
  asPage: { type: Boolean, default: false },
  limit: { type: Number, default: 0 },
})
const { plants } = useCatalog()
const list = computed(() => (props.limit ? plants.value.slice(0, props.limit) : plants.value))
</script>

<template>
  <section class="seeds" :class="{ 'seeds--page': asPage }" aria-labelledby="seeds-title">
    <div class="wrap seeds__inner">
      <header class="seeds__head">
        <component :is="asPage ? 'h1' : 'h2'" id="seeds-title" v-reveal>{{ asPage ? 'Растения' : 'Семечки' }}</component>
        <p v-reveal="80">
          Конвертик с семенами лежит на дне каждого стаканчика. Выберите, что вырастет у вас, и добавьте в букет.
        </p>
        <RouterLink v-if="limit && plants.length > limit" class="link" :to="{ name: 'plants' }">
          Все растения ({{ plants.length }})
        </RouterLink>
        <p class="seeds__note hand" aria-hidden="true">или доверьтесь флористу</p>
      </header>

      <ul class="seeds__list">
        <li class="seeds__legend" aria-hidden="true">
          <span></span>
          <span>Растение</span>
          <span>Всходы</span>
          <span>Где расти</span>
        </li>
        <li v-for="s in list" :key="s.slug" v-reveal>
          <RouterLink class="row" :to="{ name: 'plant', params: { slug: s.slug } }">
            <SeedPacket class="row__packet" :plant="s.art" :label="`Пакетик семян: ${s.name}`" />
            <span class="row__name">
              {{ s.name }}
              <em>{{ s.latin }}</em>
            </span>
            <span class="row__fact num"><span class="row__label">Всходы </span>{{ sproutLabel(s) }}</span>
            <span class="row__fact"><span class="row__label">Где </span>{{ s.where }}</span>
            <span class="row__go" aria-hidden="true">→</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.seeds {
  background: var(--color-paper-2);
  padding-block: var(--space-3xl);
}

.seeds__inner {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
  gap: var(--space-2xl);
  align-items: start;
}

.seeds__head {
  position: sticky;
  top: 6rem;
  display: grid;
  gap: var(--space-md);
}

.seeds--page {
  background: var(--color-paper);
  padding-top: var(--space-xl);
}

.seeds__head h1,
.seeds__head h2 {
  font-size: var(--text-4xl);
  font-weight: 400;
}

.seeds__head p {
  max-width: 30ch;
  color: var(--color-ink-muted);
}

.seeds__head .seeds__note {
  font-size: var(--text-xl);
  color: var(--color-accent-ink);
  transform: rotate(-3deg);
  transform-origin: left;
}

.seeds__legend,
.row {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1.1fr) 1.5rem;
  gap: var(--space-md);
  align-items: center;
}

.seeds__legend {
  padding-bottom: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
}

.seeds__legend span:nth-child(2) {
  grid-column: 2;
}

.seeds__list > li:not(.seeds__legend) {
  border-top: var(--rule-hair);
}

.seeds__list > li:last-child {
  border-bottom: var(--rule-hair);
}

.row {
  padding-block: var(--space-sm);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--dur-fast) var(--ease-out);
}

.row__packet {
  width: 4.5rem;
  height: auto;
  transition: transform var(--dur-base) var(--ease-out);
}

.row__name {
  display: grid;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.1;
  min-width: 0;
}

.row__name em {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-ink-muted);
}

.row__fact {
  font-size: var(--text-sm);
}

.row__label {
  display: none;
}

.row__go {
  font-size: var(--text-lg);
  transition: transform var(--dur-base) var(--ease-out);
}

.row:hover {
  background: var(--color-linen);
}

.row:hover .row__packet {
  transform: rotate(-4deg) translateY(-2px);
}

.row:hover .row__go {
  transform: translateX(4px);
}

@media (max-width: 56rem) {
  .seeds {
    padding-block: var(--space-2xl);
  }

  .seeds__inner {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-xl);
  }

  .seeds__head {
    position: static;
  }

  .seeds__legend {
    display: none;
  }

  .row {
    grid-template-columns: 4rem minmax(0, 1fr) 1.5rem;
    gap: var(--space-2xs) var(--space-md);
  }

  .row__packet {
    grid-row: span 3;
    width: 4rem;
  }

  .row__name,
  .row__fact {
    grid-column: 2;
  }

  .row__go {
    grid-column: 3;
    grid-row: 1;
  }

  .row__label {
    display: inline;
    color: var(--color-ink-muted);
  }
}
</style>
