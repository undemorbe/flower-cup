<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import SeedPacket from '../components/art/SeedPacket.vue'
import ChipGroup from '../components/ChipGroup.vue'
import { bouquets, seeds, findSeed, formatPrice } from '../data/catalog.js'
import { useOrder } from '../composables/useOrder.js'

const props = defineProps({ slug: { type: String, required: true } })
const router = useRouter()
const order = useOrder()

const seed = computed(() => findSeed(props.slug))
watch(seed, (s) => !s && router.replace({ name: 'home', hash: '#seeds' }), { immediate: true })

// Если букет уже выбран - кладём семечко в него, иначе предлагаем выбрать
const chosenBouquet = ref(order.state.bouquet)
const bouquetOptions = bouquets.map((b) => ({ value: b.slug, label: b.name, hint: formatPrice(b.price) }))

const added = computed(() => order.state.seed === seed.value?.slug && order.state.bouquet === chosenBouquet.value)

function addToBouquet() {
  if (!chosenBouquet.value) return
  order.setBouquet(chosenBouquet.value)
  order.setSeed(seed.value.slug)
}

const others = computed(() => seeds.filter((s) => s.slug !== props.slug))
</script>

<template>
  <article v-if="seed" class="detail wrap">
    <RouterLink class="crumb" :to="{ name: 'home', hash: '#seeds' }">← Все семечки</RouterLink>

    <div class="detail__grid">
      <figure class="detail__art detail__art--packet">
        <SeedPacket :plant="seed.plant" :label="`Пакетик семян: ${seed.name}`" />
      </figure>

      <div class="detail__info">
        <header class="detail__title">
          <span class="detail__kicker">Семена · <em>{{ seed.latin }}</em></span>
          <h1>{{ seed.name }}</h1>
          <p class="detail__lead">{{ seed.lead }}</p>
        </header>

        <dl class="list-rows">
          <div v-for="f in seed.facts" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd class="num">{{ f.value }}</dd>
          </div>
        </dl>

        <div class="buy">
          <ChipGroup v-model="chosenBouquet" legend="В какой букет положить" name="bouquet" :options="bouquetOptions" />
          <div class="buy__row">
            <button
              class="btn"
              type="button"
              :disabled="!chosenBouquet"
              :data-state="added ? 'success' : null"
              @click="addToBouquet"
            >
              {{ added ? 'Добавлено в букет' : 'Добавить в букет' }}
            </button>
            <span v-if="!chosenBouquet" class="buy__done">Сначала выберите букет</span>
            <a v-else-if="added" class="link" :href="order.telegramUrl.value" target="_blank" rel="noopener">Оформить в Telegram</a>
          </div>
        </div>

        <section class="block" aria-labelledby="care-title">
          <h2 id="care-title">Инструкция по уходу</h2>
          <ol class="steps">
            <li v-for="step in seed.care" :key="step">{{ step }}</li>
          </ol>
        </section>
      </div>
    </div>

    <section class="related" aria-labelledby="others-title">
      <header class="related__head">
        <h2 id="others-title">Другие семечки</h2>
        <RouterLink class="link" :to="{ name: 'home', hash: '#seeds' }">Все семечки</RouterLink>
      </header>
      <ul class="shelf">
        <li v-for="s in others" :key="s.slug">
          <RouterLink class="shelf__item" :to="{ name: 'seed', params: { slug: s.slug } }">
            <SeedPacket :plant="s.plant" :label="`Пакетик семян: ${s.name}`" />
            <span class="shelf__name">{{ s.name }}</span>
            <span class="shelf__meta num">{{ s.facts[0].value }} до всходов</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.shelf {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-md);
}

.shelf__item {
  display: grid;
  gap: var(--space-2xs);
  color: inherit;
  text-decoration: none;
}

.shelf__item svg {
  width: 100%;
  height: auto;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-paper-2);
  transition:
    transform var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out);
}

.shelf__item:hover svg {
  transform: rotate(-3deg) translateY(-3px);
  background: var(--color-peach);
}

.shelf__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  line-height: 1.15;
}

.shelf__meta {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
}

@media (max-width: 56rem) {
  .shelf {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 30rem) {
  .shelf {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
