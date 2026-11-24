<script setup>
// Админка Flower Cup: разделы, букеты, растения, вопросы, отзывы, QR-коды, настройки.
// С бэкендом - вход по паролю и сохранение на сервер; без бэкенда - демо-режим в этом браузере.
import { ref, reactive, computed, provide, onMounted } from 'vue'
import FieldEditor from './FieldEditor.vue'
import QrCard from './QrCard.vue'
import BouquetArt from '../components/art/BouquetArt.vue'
import SeedPacket from '../components/art/SeedPacket.vue'
import { createAdmin, AdminError } from './api.js'
import { blank, randomId } from './blank.js'
import { specs, COLLECTIONS, validateItem, validate } from '../../shared/schema.js'
import { qrTargetPath } from '../../shared/format.js'
import { clone } from '../../shared/clone.js'
import { useSeo } from '../seo/head.js'

useSeo(() => ({ title: 'Админка', noindex: true }))

const admin = createAdmin()
const isDemo = admin.mode === 'demo'

const loggedIn = ref(admin.isLoggedIn())
const password = ref('')
const loginError = ref('')
const loggingIn = ref(false)

const data = reactive({ content: null, revision: 0, stats: { qr: {} } })
const loadError = ref('')
const tab = ref('pages')
const editing = ref(null) // { collection, originalKey, draft } | { collection: 'site', draft }
const errors = ref({})
const message = ref(null) // { kind: 'ok' | 'error', text, details }
const busy = ref(false)

const tabs = [...Object.entries(COLLECTIONS).map(([key, c]) => ({ key, label: c.label })), { key: 'site', label: 'Настройки' }]

const items = computed(() => (data.content && tab.value !== 'site' ? data.content[tab.value] : []))
const keyOf = (col, item) => item[COLLECTIONS[col].key]
const titleOf = (col, item) => COLLECTIONS[col].title(item)

provide('refOptions', () => {
  const c = data.content
  if (!c) return {}
  return {
    plants: c.plants.map((p) => ({ value: p.slug, label: p.name })),
    bouquets: c.bouquets.map((b) => ({ value: b.slug, label: b.name })),
    pages: c.pages.map((p) => ({ value: p.slug, label: p.menuLabel })),
  }
})

async function load() {
  loadError.value = ''
  try {
    Object.assign(data, await admin.load())
  } catch (err) {
    if (err.status === 401) loggedIn.value = false
    loadError.value = err.message
  }
}

async function login() {
  loginError.value = ''
  loggingIn.value = true
  try {
    await admin.login(password.value)
    password.value = ''
    loggedIn.value = true
    await load()
  } catch (err) {
    loginError.value = err.message
  } finally {
    loggingIn.value = false
  }
}

function logout() {
  admin.logout()
  loggedIn.value = false
  data.content = null
}

function open(col, item) {
  errors.value = {}
  message.value = null
  editing.value = { collection: col, originalKey: item ? keyOf(col, item) : null, draft: clone(item ?? newItem(col)) }
}

function newItem(col) {
  const item = blank(specs[col])
  if (col === 'faq') item.id = randomId('q')
  if (col === 'reviews') item.id = randomId('r')
  if (col === 'bouquets') item.art = clone(data.content.bouquets[0]?.art ?? item.art)
  return item
}

function openSite() {
  errors.value = {}
  message.value = null
  editing.value = { collection: 'site', draft: clone(data.content.site) }
}

const errorMap = (list) => Object.fromEntries((list ?? []).map((e) => [e.path, e.message]))

async function run(change, okText) {
  busy.value = true
  message.value = null
  try {
    const res = await admin.change(data.revision, change)
    data.revision = res.revision
    await load()
    message.value = { kind: 'ok', text: okText }
    return true
  } catch (err) {
    const e = err instanceof AdminError ? err : new AdminError(String(err))
    errors.value = errorMap(e.details)
    message.value = { kind: 'error', text: e.message, details: e.details.map((d) => d.message) }
    if (e.status === 401) loggedIn.value = false
    return false
  } finally {
    busy.value = false
  }
}

async function save() {
  const ed = editing.value
  // Сначала проверяем в браузере - те же правила, что на сервере
  const checked = ed.collection === 'site' ? validate(specs.site, ed.draft) : validateItem(ed.collection, ed.draft)
  if (!checked.ok) {
    errors.value = errorMap(checked.errors)
    message.value = { kind: 'error', text: 'Проверьте отмеченные поля', details: checked.errors.map((e) => e.message) }
    return
  }
  const change =
    ed.collection === 'site'
      ? { op: 'site', site: checked.value }
      : { op: 'upsert', collection: ed.collection, originalKey: ed.originalKey, item: checked.value }
  if (await run(change, 'Сохранено')) {
    if (ed.collection !== 'site') ed.originalKey = keyOf(ed.collection, checked.value)
    errors.value = {}
  }
}

// Удаление в два нажатия, без системного confirm()
const confirmDelete = ref(false)
async function removeCurrent() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    setTimeout(() => (confirmDelete.value = false), 4000)
    return
  }
  confirmDelete.value = false
  const ed = editing.value
  if (await run({ op: 'remove', collection: ed.collection, key: ed.originalKey }, 'Удалено')) editing.value = null
}

async function move(col, index, dir) {
  const keys = data.content[col].map((x) => keyOf(col, x))
  const j = index + dir
  if (j < 0 || j >= keys.length) return
  ;[keys[index], keys[j]] = [keys[j], keys[index]]
  await run({ op: 'reorder', collection: col, keys }, 'Порядок сохранён')
}

function resetDemo() {
  admin.reset()
  editing.value = null
  load()
}

const sitePath = (col, item) =>
  ({
    pages: `/${item.slug}`,
    bouquets: `/bouquets/${item.slug}`,
    plants: `/plants/${item.slug}`,
    qr: qrTargetPath(item.target),
  })[col]
const base = import.meta.env.BASE_URL.replace(/\/$/, '')

onMounted(() => {
  if (loggedIn.value) load()
})
</script>

<template>
  <div class="adm">
    <header class="adm__bar">
      <div class="adm__brand">
        <RouterLink class="adm__logo" :to="{ name: 'home' }">Flower Cup</RouterLink>
        <span class="adm__mode" :class="`is-${admin.mode}`">{{ isDemo ? 'демо' : 'админка' }}</span>
      </div>
      <nav class="adm__links">
        <RouterLink :to="{ name: 'home' }">На сайт</RouterLink>
        <button v-if="!isDemo && loggedIn" type="button" @click="logout">Выйти</button>
      </nav>
    </header>

    <p v-if="isDemo" class="adm__demo">
      Бэкенд не подключён - это демо-режим. Правки сохраняются только в этом браузере и видны на сайте только вам.
      Чтобы правки увидели все, запустите бэкенд и соберите сайт с <code>VITE_API_URL</code>.
      <button type="button" @click="resetDemo">Сбросить демо</button>
    </p>

    <!-- вход -->
    <form v-if="!loggedIn" class="adm__login" @submit.prevent="login">
      <h1>Вход в админку</h1>
      <label for="adm-pass">Пароль</label>
      <input id="adm-pass" v-model="password" type="password" autocomplete="current-password" required maxlength="256" />
      <button class="btn" type="submit" :disabled="loggingIn || !password">{{ loggingIn ? 'Проверяем…' : 'Войти' }}</button>
      <p v-if="loginError" class="adm__err" role="alert">{{ loginError }}</p>
    </form>

    <template v-else>
      <p v-if="loadError" class="adm__err adm__load" role="alert">
        {{ loadError }} <button type="button" @click="load">Повторить</button>
      </p>

      <div v-if="data.content" class="adm__body">
        <nav class="adm__tabs" aria-label="Данные">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            :class="{ 'is-on': tab === t.key }"
            @click="((tab = t.key), (editing = null), t.key === 'site' && openSite())"
          >
            {{ t.label }}
            <span v-if="t.key !== 'site'" class="num">{{ data.content[t.key].length }}</span>
          </button>
        </nav>

        <section v-if="tab !== 'site'" class="adm__list" :class="{ 'is-hidden-mobile': editing }" aria-label="Список">
          <div class="adm__list-head">
            <h2>{{ COLLECTIONS[tab].label }}</h2>
            <button class="btn" type="button" @click="open(tab)">+ Добавить</button>
          </div>
          <ol>
            <li v-for="(item, i) in items" :key="keyOf(tab, item)" :class="{ 'is-current': editing?.originalKey === keyOf(tab, item) }">
              <button class="adm__item" type="button" @click="open(tab, item)">
                <span class="adm__item-title">{{ titleOf(tab, item) }}</span>
                <span class="adm__item-meta">
                  {{ keyOf(tab, item) }}
                  <em v-if="item.published === false || item.active === false">скрыт</em>
                  <span v-if="tab === 'qr' && data.stats.qr?.[item.code]" class="num"> · {{ data.stats.qr[item.code].scans }} перех.</span>
                </span>
              </button>
              <span class="adm__order">
                <button type="button" :disabled="i === 0 || busy" aria-label="Выше" @click="move(tab, i, -1)">↑</button>
                <button type="button" :disabled="i === items.length - 1 || busy" aria-label="Ниже" @click="move(tab, i, 1)">↓</button>
              </span>
            </li>
          </ol>
        </section>

        <section v-if="editing" class="adm__editor" aria-label="Редактор">
          <div class="adm__editor-head">
            <button v-if="tab !== 'site'" class="adm__back" type="button" @click="editing = null">← К списку</button>
            <h2>
              {{ editing.collection === 'site' ? 'Настройки сайта' : editing.originalKey ? 'Редактирование' : 'Новая запись' }}
            </h2>
            <a
              v-if="editing.originalKey && sitePath(editing.collection, editing.draft)"
              class="link"
              :href="`${base}${sitePath(editing.collection, editing.draft)}`"
              target="_blank"
              rel="noopener"
            >Открыть на сайте</a>
          </div>

          <div v-if="editing.collection === 'bouquets'" class="adm__preview">
            <BouquetArt :art="editing.draft.art ?? []" label="Предпросмотр букета" />
          </div>
          <div v-if="editing.collection === 'plants'" class="adm__preview adm__preview--packet">
            <SeedPacket :plant="editing.draft.art" label="Предпросмотр пакетика" />
          </div>
          <div v-if="editing.collection === 'qr' && editing.draft.code" class="adm__qr">
            <QrCard :code="editing.draft.code" :scans="data.stats.qr?.[editing.draft.code]" />
          </div>

          <form class="adm__form" @submit.prevent="save">
            <FieldEditor
              :spec="editing.collection === 'site' ? specs.site : specs[editing.collection]"
              :model-value="editing.draft"
              :errors="errors"
              @update:model-value="editing.draft = $event"
            />

            <div v-if="message" class="adm__msg" :class="`is-${message.kind}`" role="status">
              <p>{{ message.text }}</p>
              <ul v-if="message.details?.length">
                <li v-for="d in message.details.slice(0, 8)" :key="d">{{ d }}</li>
              </ul>
            </div>

            <div class="adm__actions">
              <button class="btn" type="submit" :disabled="busy">{{ busy ? 'Сохраняем…' : 'Сохранить' }}</button>
              <button
                v-if="editing.originalKey"
                class="adm__delete"
                type="button"
                :disabled="busy"
                @click="removeCurrent"
              >
                {{ confirmDelete ? 'Точно удалить?' : 'Удалить' }}
              </button>
            </div>
          </form>
        </section>
        <p v-else-if="tab !== 'site'" class="adm__hint">Выберите запись слева или добавьте новую.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.adm {
  min-height: 100svh;
  background: var(--color-paper);
  padding-bottom: var(--space-2xl);
}

.adm__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: calc(var(--space-xs) + env(safe-area-inset-top, 0px)) var(--page-gutter) var(--space-xs);
  background: var(--color-forest-deep);
  color: var(--color-on-forest);
}

.adm__brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.adm__logo {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  text-decoration: none;
}

.adm__mode {
  padding: 0.1rem var(--space-2xs);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  background: var(--color-forest);
  color: var(--color-on-forest-muted);
}

.adm__mode.is-demo {
  background: var(--color-peach);
  color: var(--color-ink);
}

.adm__links {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-sm);
}

.adm__links button {
  border: 0;
  background: none;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.adm__demo {
  margin: var(--space-sm) var(--page-gutter) 0;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-peach);
  font-size: var(--text-sm);
}

.adm__demo button,
.adm__load button {
  margin-left: var(--space-2xs);
  border: 0;
  background: none;
  text-decoration: underline;
  font-size: inherit;
}

.adm__login {
  display: grid;
  gap: var(--space-xs);
  max-width: 22rem;
  margin: var(--space-3xl) auto 0;
  padding-inline: var(--page-gutter);
}

.adm__login h1 {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-sm);
}

.adm__login label {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
}

.adm__login input {
  min-height: 3rem;
  padding: 0 var(--space-sm);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-sm);
  font: inherit;
  background: var(--color-paper);
}

.adm__login .btn {
  justify-content: center;
  margin-top: var(--space-xs);
}

.adm__err {
  color: var(--color-accent-ink);
  font-size: var(--text-sm);
}

.adm__load {
  margin: var(--space-md) var(--page-gutter) 0;
}

.adm__body {
  display: grid;
  grid-template-columns: 11rem minmax(0, 20rem) minmax(0, 1fr);
  gap: var(--space-lg);
  align-items: start;
  padding: var(--space-lg) var(--page-gutter) 0;
  max-width: 96rem;
  margin-inline: auto;
}

.adm__tabs {
  position: sticky;
  top: 5rem;
  display: grid;
  gap: 2px;
}

.adm__tabs button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2xs);
  min-height: 2.5rem;
  padding: 0 var(--space-sm);
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  font-size: var(--text-sm);
  text-align: left;
}

.adm__tabs button span {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
}

.adm__tabs button:hover {
  background: var(--color-paper-2);
}

.adm__tabs button.is-on {
  background: var(--color-forest);
  color: var(--color-on-forest);
}

.adm__tabs button.is-on span {
  color: var(--color-on-forest-muted);
}

.adm__list-head,
.adm__editor-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.adm__list-head h2,
.adm__editor-head h2 {
  font-size: var(--text-xl);
}

.adm__list-head .btn {
  min-height: 2.5rem;
}

.adm__list ol {
  display: grid;
  gap: 2px;
}

.adm__list li {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  border-radius: var(--radius-sm);
  background: var(--color-paper-2);
}

.adm__list li.is-current {
  outline: 2px solid var(--color-forest);
}

.adm__item {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
  padding: var(--space-xs) var(--space-sm);
  border: 0;
  background: none;
  text-align: left;
}

.adm__item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.adm__item-meta {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
}

.adm__item-meta em {
  margin-left: var(--space-3xs);
  font-style: normal;
  color: var(--color-accent-ink);
}

.adm__order {
  display: flex;
  padding-right: var(--space-2xs);
}

.adm__order button {
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
}

.adm__order button:hover:not(:disabled) {
  background: var(--color-paper);
}

.adm__order button:disabled {
  opacity: 0.3;
}

.adm__editor {
  display: grid;
  gap: var(--space-md);
  min-width: 0;
}

.adm__back {
  display: none;
  border: 0;
  background: none;
  font-size: var(--text-sm);
}

.adm__preview {
  display: grid;
  place-items: center;
  max-width: 16rem;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-linen);
}

.adm__preview--packet {
  max-width: 10rem;
}

.adm__preview :deep(svg) {
  width: 100%;
  height: auto;
}

.adm__qr {
  max-width: 30rem;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-paper-2);
}

.adm__form {
  display: grid;
  gap: var(--space-md);
  max-width: 46rem;
}

.adm__msg {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.adm__msg.is-ok {
  background: var(--color-paper-2);
  color: var(--color-forest);
}

.adm__msg.is-error {
  background: var(--color-peach);
}

.adm__msg ul {
  margin-top: var(--space-2xs);
  padding-left: var(--space-md);
  list-style: disc;
}

.adm__actions {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding-block: var(--space-sm) calc(var(--space-sm) + env(safe-area-inset-bottom, 0px));
  background: var(--color-paper);
  border-top: var(--rule-hair);
}

.adm__delete {
  min-height: 2.5rem;
  padding: 0 var(--space-sm);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-pill);
  background: none;
  color: var(--color-accent-ink);
  font-size: var(--text-sm);
}

.adm__delete:hover {
  background: var(--color-accent);
  color: var(--color-paper);
}

.adm__hint {
  color: var(--color-ink-muted);
  padding-top: var(--space-xl);
}

@media (max-width: 64rem) {
  .adm__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .adm__tabs {
    position: static;
    display: flex;
    overflow-x: auto;
    gap: var(--space-3xs);
    margin-inline: calc(var(--page-gutter) * -1);
    padding-inline: var(--page-gutter);
    scrollbar-width: none;
  }

  .adm__tabs button {
    flex: none;
    border: 1px solid var(--color-rule);
    border-radius: var(--radius-pill);
  }

  .adm__list.is-hidden-mobile {
    display: none;
  }

  .adm__back {
    display: inline;
  }

  .adm__hint {
    display: none;
  }
}
</style>
