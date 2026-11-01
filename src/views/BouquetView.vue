<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BouquetArt from '../components/art/BouquetArt.vue'
import BouquetCard from '../components/BouquetCard.vue'
import ChipGroup from '../components/ChipGroup.vue'
import { bouquets, seeds, bouquetCare, findBouquet, formatPrice } from '../data/catalog.js'
import { useOrder } from '../composables/useOrder.js'

const props = defineProps({ slug: { type: String, required: true } })
const router = useRouter()
const order = useOrder()

const bouquet = computed(() => findBouquet(props.slug))
watch(bouquet, (b) => !b && router.replace({ name: 'home', hash: '#bouquets' }), { immediate: true })

const chosenSeed = ref(null)
watch(
  bouquet,
  (b) => {
    if (!b) return
    chosenSeed.value = order.state.bouquet === b.slug && order.state.seed ? order.state.seed : b.seed
  },
  { immediate: true },
)

const seedOptions = computed(() =>
  seeds.map((s) => ({ value: s.slug, label: s.name, hint: s.slug === bouquet.value?.seed ? 'к букету' : '' })),
)

const inOrder = computed(
  () => order.state.bouquet === bouquet.value?.slug && order.state.seed === chosenSeed.value,
)

function addToOrder() {
  order.setBouquet(bouquet.value.slug)
  order.setSeed(chosenSeed.value)
}

const care = computed(() => [...bouquetCare, ...(bouquet.value?.care ?? [])])
const analogs = computed(() => bouquets.filter((b) => b.slug !== props.slug))
</script>

<template>
  <article v-if="bouquet" class="detail wrap">
    <RouterLink class="crumb" :to="{ name: 'home', hash: '#bouquets' }">← Все букеты</RouterLink>

    <div class="detail__grid">
      <figure class="detail__art">
        <BouquetArt :art="bouquet.art" :label="`Букет «${bouquet.name}» в крафтовом стаканчике`" />
      </figure>

      <div class="detail__info">
        <header class="detail__title">
          <span class="detail__kicker">{{ bouquet.size }}</span>
          <h1>{{ bouquet.name }}</h1>
          <p class="detail__price num">{{ formatPrice(bouquet.price) }}</p>
          <p class="detail__lead">{{ bouquet.lead }}</p>
        </header>

        <div class="buy">
          <ChipGroup v-model="chosenSeed" legend="Семечко на дне стаканчика" name="seed" :options="seedOptions" />
          <div class="buy__row">
            <button class="btn" type="button" :data-state="inOrder ? 'success' : null" @click="addToOrder">
              {{ inOrder ? 'В заказе' : 'Заказать этот букет' }}
            </button>
            <a v-if="inOrder" class="link" :href="order.telegramUrl.value" target="_blank" rel="noopener">Оформить в Telegram</a>
          </div>
        </div>

        <section class="block" aria-labelledby="inside-title">
          <h2 id="inside-title">Что внутри</h2>
          <dl class="list-rows">
            <div v-for="item in bouquet.inside" :key="item.name">
              <dt>{{ item.name }}</dt>
              <dd class="num">{{ item.qty }}</dd>
            </div>
            <div>
              <dt>Стаканчик из крафт-картона</dt>
              <dd>с конвертиком семян</dd>
            </div>
          </dl>
        </section>

        <section class="block" aria-labelledby="care-title">
          <h2 id="care-title">Инструкция по уходу</h2>
          <ol class="steps">
            <li v-for="step in care" :key="step">{{ step }}</li>
          </ol>
        </section>
      </div>
    </div>

    <section class="related" aria-labelledby="analogs-title">
      <header class="related__head">
        <h2 id="analogs-title">Аналоги</h2>
        <RouterLink class="link" :to="{ name: 'home', hash: '#bouquets' }">Все букеты</RouterLink>
      </header>
      <ul class="analogs">
        <li v-for="b in analogs" :key="b.slug"><BouquetCard :bouquet="b" /></li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.analogs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-md);
}

@media (max-width: 40rem) {
  .analogs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
