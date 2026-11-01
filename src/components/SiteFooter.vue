<script setup>
import { ref, computed } from 'vue'
import { site } from '../data/site.js'
import { useOrder } from '../composables/useOrder.js'
import { formatPrice } from '../data/catalog.js'

const { bouquet, seed, orderText, telegramUrl } = useOrder()
const copyState = ref('default') // default | success | error

const phoneHref = computed(() => `tel:${site.phone.replace(/[^+\d]/g, '')}`)

async function copyOrder() {
  try {
    await navigator.clipboard.writeText(orderText.value)
    copyState.value = 'success'
  } catch {
    copyState.value = 'error'
  }
  setTimeout(() => (copyState.value = 'default'), 2200)
}

const year = new Date().getFullYear()
</script>

<template>
  <footer id="contacts" class="foot" aria-labelledby="contacts-title">
    <div class="wrap foot__inner">
      <div class="foot__mast">
        <p class="foot__word">Flower Cup</p>
        <p class="foot__tag hand">{{ site.tagline.toLowerCase() }}</p>
      </div>

      <div class="foot__body">
        <h2 id="contacts-title">Контакты</h2>

        <div v-if="bouquet" class="order">
          <p class="order__label">Ваш стаканчик</p>
          <p class="order__what">
            {{ bouquet.name }}<template v-if="seed"> + {{ seed.name.toLowerCase() }}</template>
            <span class="num"> · {{ formatPrice(bouquet.price) }}</span>
          </p>
          <div class="order__actions">
            <a class="btn btn--light" :href="telegramUrl" target="_blank" rel="noopener">
              Заказать в Telegram <span class="arrow">→</span>
            </a>
            <button class="foot__copy" type="button" :data-state="copyState" @click="copyOrder">
              {{ copyState === 'success' ? 'Скопировано' : copyState === 'error' ? 'Не вышло - скопируйте вручную' : 'Скопировать заказ' }}
            </button>
          </div>
        </div>
        <p v-else class="foot__invite">
          Напишите в Telegram, какой букет и какое семечко хотите, - ответим и посчитаем.
        </p>

        <dl class="contacts">
          <div>
            <dt>Telegram</dt>
            <dd><a class="link" :href="`https://t.me/${site.telegram}`" target="_blank" rel="noopener">@{{ site.telegram }}</a></dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd><a class="link num" :href="phoneHref">{{ site.phone }}</a></dd>
          </div>
          <div>
            <dt>Почта</dt>
            <dd><a class="link" :href="`mailto:${site.email}`">{{ site.email }}</a></dd>
          </div>
          <div>
            <dt>Доставка</dt>
            <dd>{{ site.city }}</dd>
          </div>
        </dl>
      </div>

      <p class="foot__base">© {{ year }} Flower Cup</p>
    </div>
  </footer>
</template>

<style scoped>
.foot {
  background: var(--color-forest-deep);
  color: var(--color-on-forest);
  padding-block: var(--space-3xl) var(--space-lg);
}

.foot__inner {
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 6fr);
  gap: var(--space-2xl) var(--space-xl);
}

.foot__word {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 500;
  line-height: 0.9;
  letter-spacing: -0.02em;
}

.foot__tag {
  margin-top: var(--space-sm);
  font-size: var(--text-xl);
  color: var(--color-kraft);
}

.foot__body {
  display: grid;
  gap: var(--space-lg);
  align-content: start;
}

.foot__body h2 {
  font-size: var(--text-2xl);
}

.foot__invite {
  max-width: 40ch;
  color: var(--color-on-forest-muted);
}

.order {
  display: grid;
  gap: var(--space-2xs);
  padding: var(--space-md);
  border: 1px solid var(--color-forest-rule);
  border-radius: var(--radius-md);
}

.order__label {
  font-size: var(--text-xs);
  color: var(--color-on-forest-muted);
}

.order__what {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
}

.order__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-md);
  margin-top: var(--space-xs);
}

.foot__copy {
  padding: var(--space-2xs) 0;
  border: 0;
  background: none;
  font-size: var(--text-sm);
  color: var(--color-on-forest);
  text-decoration: underline;
  text-underline-offset: 0.25em;
  text-decoration-thickness: 1px;
  white-space: nowrap;
}

.foot__copy:hover {
  color: var(--color-peach);
}

.foot__copy[data-state='success'] {
  color: var(--color-kraft);
  text-decoration: none;
}

.foot__copy[data-state='error'] {
  color: var(--color-peach);
}

.contacts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md) var(--space-lg);
  margin: 0;
}

.contacts div {
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-forest-rule);
}

.contacts dt {
  font-size: var(--text-xs);
  color: var(--color-on-forest-muted);
}

.contacts dd {
  margin: var(--space-3xs) 0 0;
  font-size: var(--text-md);
  overflow-wrap: anywhere;
}

.foot__base {
  grid-column: 1 / -1;
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-forest-rule);
  font-size: var(--text-xs);
  color: var(--color-on-forest-muted);
}

@media (max-width: 56rem) {
  .foot {
    padding-block: var(--space-2xl) var(--space-lg);
  }

  .foot__inner {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 30rem) {
  .contacts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
