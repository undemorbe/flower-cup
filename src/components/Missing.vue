<script setup>
// Своя страница «не найдено» - одна на весь сайт: неизвестный адрес, удалённый букет,
// растение, раздел или QR-код. Пока контент грузится из API, показываем ожидание:
// запись может быть уже в базе, но ещё не во встроенном снимке.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CupStage from './art/CupStage.vue'
import { state, useCatalog } from '../content/store.js'
import { telegramLink } from '../../shared/format.js'

const props = defineProps({
  what: { type: String, default: 'Здесь ничего не проросло' },
  back: { type: Object, default: () => ({ name: 'home' }) },
  backLabel: { type: String, default: 'На главную' },
})

const route = useRoute()
const { site } = useCatalog()
const fromQr = computed(() => route.path.startsWith('/q/') || route.query.from === 'qr')

const links = computed(() =>
  [
    { to: { name: 'bouquets' }, label: 'Букеты', text: 'Собраны в стаканчиках с семенами' },
    { to: { name: 'plants' }, label: 'Растения', text: 'Что вырастет из семечка и как' },
    { to: { name: 'faq' }, label: 'Вопросы', text: 'Доставка, уход, посадка' },
    { to: { name: 'home' }, label: 'Главная', text: 'С самого начала' },
  ].filter((l) => l.to.name !== props.back.name),
)

const helpUrl = computed(() => telegramLink(site.value.telegram, 'Здравствуйте! Не открылась страница на сайте Flower Cup.'))
</script>

<template>
  <section class="nf wrap" aria-live="polite">
    <p v-if="state.status === 'loading'" class="nf__wait">Загружаем…</p>
    <template v-else>
      <div class="nf__head">
        <div class="nf__art" aria-hidden="true">
          <CupStage :stage="3" />
          <span class="nf__code hand">404</span>
        </div>
        <div class="nf__copy">
          <p class="nf__kicker hand">ой</p>
          <h1>{{ what }}</h1>
          <p v-if="fromQr">
            QR-код со стаканчика ведёт на страницу, которой больше нет. Семечко всё равно можно посадить -
            напишите нам, подскажем, что за растение.
          </p>
          <p v-else>Возможно, ссылка устарела или раздел убрали. Загляните в одну из грядок ниже.</p>
          <div class="nf__actions">
            <RouterLink class="btn" :to="back">{{ backLabel }} <span class="arrow">→</span></RouterLink>
            <a class="btn btn--ghost" :href="helpUrl" target="_blank" rel="noopener noreferrer">Написать нам</a>
          </div>
        </div>
      </div>

      <nav class="nf__links" aria-label="Куда пойти">
        <RouterLink v-for="l in links" :key="l.label" class="nf__tile" :to="l.to">
          <span class="nf__label">{{ l.label }}</span>
          <span class="nf__text">{{ l.text }}</span>
          <span class="nf__go" aria-hidden="true">→</span>
        </RouterLink>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.nf {
  display: grid;
  gap: var(--space-2xl);
  padding-block: var(--space-3xl);
}

.nf__wait {
  font-size: var(--text-md);
}

.nf__head {
  display: grid;
  grid-template-columns: minmax(10rem, 16rem) 1fr;
  gap: var(--space-xl);
  align-items: center;
}

.nf__art {
  position: relative;
  color: var(--color-ink);
}

.nf__art :deep(svg) {
  width: 100%;
  height: auto;
}

.nf__code {
  position: absolute;
  top: -0.4em;
  right: 0;
  font-size: var(--text-3xl);
  color: var(--color-accent-ink);
  transform: rotate(8deg);
}

.nf__copy {
  display: grid;
  justify-items: start;
  gap: var(--space-sm);
  max-width: 34rem;
}

.nf__kicker {
  font-size: var(--text-2xl);
  color: var(--color-accent-ink);
  transform: rotate(-4deg);
  line-height: 1;
}

.nf__copy h1 {
  font-size: var(--text-3xl);
  line-height: 1.05;
}

.nf__copy p {
  color: var(--color-ink-muted);
}

.nf__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.nf__links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr));
  gap: var(--space-sm);
}

.nf__tile {
  position: relative;
  display: grid;
  gap: var(--space-3xs);
  min-height: 6.5rem;
  align-content: end;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-paper-2);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--dur-base) var(--ease-out);
}

.nf__tile:hover {
  background: var(--color-peach);
}

.nf__label {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.1;
}

.nf__text {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  padding-right: var(--space-lg);
}

.nf__go {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  transition: transform var(--dur-base) var(--ease-out);
}

.nf__tile:hover .nf__go {
  transform: translateX(3px);
}

@media (max-width: 47.99rem) {
  .nf {
    padding-block: var(--space-xl) var(--space-2xl);
    gap: var(--space-xl);
  }

  .nf__head {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .nf__art {
    width: 9rem;
  }
}
</style>
