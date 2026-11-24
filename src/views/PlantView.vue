<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import SeedPacket from '../components/art/SeedPacket.vue'
import ChipGroup from '../components/ChipGroup.vue'
import Missing from '../components/Missing.vue'
import { useCatalog } from '../content/store.js'
import { formatPrice, sproutLabel, plural } from '../../shared/format.js'
import { useOrder } from '../composables/useOrder.js'
import { usePlanting } from '../composables/usePlanting.js'
import { useSeo, ld } from '../seo/head.js'

// Страница растения. Сюда ведут QR-коды с пакетиков семян (/q/<код> -> /plants/<slug>?from=qr)
const props = defineProps({ slug: { type: String, required: true } })
const route = useRoute()
const order = useOrder()
const { bouquets, plants, findPlant } = useCatalog()

const seed = computed(() => findPlant(props.slug))
const fromQr = computed(() => route.query.from === 'qr')

// Если букет уже выбран - кладём семечко в него, иначе предлагаем выбрать
const chosenBouquet = ref(order.state.bouquet)
const bouquetOptions = computed(() => bouquets.value.map((b) => ({ value: b.slug, label: b.name, hint: formatPrice(b.price) })))

const added = computed(() => order.state.seed === seed.value?.slug && order.state.bouquet === chosenBouquet.value)

function addToBouquet() {
  if (!chosenBouquet.value) return
  order.setBouquet(chosenBouquet.value)
  order.setSeed(seed.value.slug)
}

const others = computed(() => plants.value.filter((s) => s.slug !== props.slug))
const facts = computed(() =>
  seed.value ? [{ label: 'Всходы', value: sproutLabel(seed.value) }, ...seed.value.facts, { label: 'Где расти', value: seed.value.where }] : [],
)

// Дневник посадки
const planting = usePlanting(seed)
const days = (n) => `${n} ${plural(n, ['день', 'дня', 'дней'])}`
const growText = computed(() => {
  const st = planting.status.value
  if (!st) return null
  const p = seed.value
  if (st.stage === 'waiting') return { day: `День ${st.day + 1}`, hint: `Всходы ждём через ${days(st.daysToMin)} - обычно на ${p.sproutMin}–${p.sproutMax} день.` }
  if (st.stage === 'sprouting') return { day: `День ${st.day + 1}`, hint: 'Самое время для всходов - загляните под плёнку.' }
  return { day: `День ${st.day + 1}`, hint: `Всходы обычно появляются за ${days(p.sproutMax)}. Не взошло? Напишите нам - разберёмся.` }
})

useSeo(() => {
  const p = seed.value
  if (!p) return { title: 'Растение не найдено', noindex: true }
  return {
    title: `${p.name}: как вырастить из семян`,
    heading: p.name,
    description: `${p.lead} Всходы через ${sproutLabel(p)}. Пошаговая инструкция для стаканчика Flower Cup.`,
    path: `/plants/${p.slug}`,
    type: 'article',
    jsonLd: [
      ld.howTo(p),
      ld.breadcrumbs([
        { name: 'Главная', path: '/' },
        { name: 'Растения', path: '/plants' },
        { name: p.name, path: `/plants/${p.slug}` },
      ]),
    ],
  }
})
</script>

<template>
  <article v-if="seed" class="detail wrap">
    <RouterLink class="crumb" :to="{ name: 'plants' }">← Все растения</RouterLink>

    <div class="detail__grid">
      <figure class="detail__art detail__art--packet">
        <SeedPacket :plant="seed.art" :label="`Пакетик семян: ${seed.name}`" />
      </figure>

      <div class="detail__info">
        <header class="detail__title">
          <span class="detail__kicker">Семена<template v-if="seed.latin"> · <em>{{ seed.latin }}</em></template></span>
          <h1>{{ seed.name }}</h1>
          <p class="detail__lead">{{ seed.lead }}</p>
          <p v-if="fromQr" class="qr-hello">
            <strong>Это семечко из вашего стаканчика</strong>
            <span>Ниже - как его посадить. Отметьте день посадки, и мы подскажем, когда ждать всходов.</span>
          </p>
        </header>

        <dl class="list-rows">
          <div v-for="f in facts" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd class="num">{{ f.value }}</dd>
          </div>
        </dl>

        <section class="block grow" aria-labelledby="grow-title">
          <h2 id="grow-title">Мой стаканчик</h2>
          <template v-if="growText">
            <p class="grow__day num">{{ growText.day }}</p>
            <div class="grow__meter" aria-hidden="true">
              <span :style="{ transform: `scaleX(${planting.status.value.progress})` }"></span>
            </div>
            <p class="grow__hint">{{ growText.hint }}</p>
            <button class="grow__reset" type="button" @click="planting.reset">Начать заново</button>
          </template>
          <template v-else>
            <p class="grow__hint">Посадили семечко? Отметьте - будем считать дни до всходов. Дата хранится только на этом устройстве.</p>
            <div class="grow__row">
              <button class="btn" type="button" @click="planting.plantToday">Посадил(а) сегодня</button>
            </div>
          </template>
        </section>

        <section class="block" aria-labelledby="care-title">
          <h2 id="care-title">Как вырастить</h2>
          <ol class="steps">
            <li v-for="step in seed.care" :key="step">{{ step }}</li>
          </ol>
        </section>

        <div class="buy">
          <ChipGroup v-model="chosenBouquet" legend="Положить это семечко в букет" name="bouquet" :options="bouquetOptions" />
          <div class="buy__row">
            <button
              class="btn btn--ghost"
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
      </div>
    </div>

    <section v-if="others.length" class="related" aria-labelledby="others-title">
      <header class="related__head">
        <h2 id="others-title">Другие растения</h2>
        <RouterLink class="link" :to="{ name: 'plants' }">Все растения</RouterLink>
      </header>
      <ul class="shelf">
        <li v-for="s in others" :key="s.slug">
          <RouterLink class="shelf__item" :to="{ name: 'plant', params: { slug: s.slug } }">
            <SeedPacket :plant="s.art" :label="`Пакетик семян: ${s.name}`" />
            <span class="shelf__name">{{ s.name }}</span>
            <span class="shelf__meta num">{{ sproutLabel(s) }} до всходов</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </article>
  <Missing v-else what="Такого растения нет" :back="{ name: 'plants' }" back-label="Все растения" />
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

.qr-hello {
  display: grid;
  gap: var(--space-3xs);
  margin-top: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-peach);
}

.qr-hello strong {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: 1.2;
}

.grow {
  display: grid;
  gap: var(--space-sm);
}

.grow__meter {
  height: 0.5rem;
  border-radius: var(--radius-pill);
  background: var(--color-paper-2);
  overflow: hidden;
}

.grow__meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-sage);
  transform-origin: left;
  transition: transform var(--dur-slow) var(--ease-out);
}

.grow__day {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: 1.1;
}

.grow__hint {
  color: var(--color-ink-muted);
}

.grow__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-md);
}

.grow__reset {
  justify-self: start;
  padding: var(--space-2xs) 0;
  border: 0;
  background: none;
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  text-decoration: underline;
  text-underline-offset: 0.25em;
}
</style>
