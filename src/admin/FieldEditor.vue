<script setup>
// Форма по схеме из shared/schema.js: строки, числа, списки, вложенные объекты, блоки
import { computed, inject } from 'vue'
import { blank, blankVariant } from './blank.js'

defineOptions({ name: 'FieldEditor' })

const props = defineProps({
  spec: { type: Object, required: true },
  modelValue: { default: undefined },
  name: { type: String, default: '' },
  siblings: { type: Object, default: null }, // соседние поля объекта (для зависимых списков)
  errors: { type: Object, default: () => ({}) }, // path -> сообщение
  path: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const refOptions = inject('refOptions', () => ({}))
const set = (v) => emit('update:modelValue', v)
const uid = `f${Math.random().toString(36).slice(2, 9)}`
const error = computed(() => props.errors[props.path])

// Цель QR-кода: список зависит от выбранного типа
const dependent = computed(() => {
  if (props.name !== 'slug' || !props.siblings?.type) return null
  const col = { plant: 'plants', bouquet: 'bouquets', page: 'pages' }[props.siblings.type]
  return col ? refOptions()[col] ?? [] : []
})

const options = computed(() => (props.spec.kind === 'ref' ? refOptions()[props.spec.collection] ?? [] : []))

function setField(key, v) {
  set({ ...props.modelValue, [key]: v })
}

// --- списки ---
const list = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
const setItem = (i, v) => set(list.value.map((x, j) => (j === i ? v : x)))
const remove = (i) => set(list.value.filter((_, j) => j !== i))
const move = (i, d) => {
  const next = [...list.value]
  const j = i + d
  if (j < 0 || j >= next.length) return
  ;[next[i], next[j]] = [next[j], next[i]]
  set(next)
}
const addItem = (type) =>
  set([...list.value, type ? blankVariant(type, props.spec.of.variants[type]) : blank(props.spec.of)])

const isSimpleList = computed(() => props.spec.kind === 'list' && props.spec.of.kind === 'str')
const variantOf = (item) => props.spec.variants?.[item?.type]
</script>

<template>
  <!-- строка -->
  <div v-if="spec.kind === 'str' && !dependent" class="fe fe--field" :class="{ 'has-error': error }">
    <label :for="uid">{{ spec.label }}<span v-if="!spec.optional" class="req" aria-hidden="true">*</span></label>
    <textarea
      v-if="spec.multiline"
      :id="uid"
      :value="modelValue ?? ''"
      :maxlength="spec.max"
      rows="3"
      @input="set($event.target.value)"
    ></textarea>
    <input v-else :id="uid" type="text" :value="modelValue ?? ''" :maxlength="spec.max" @input="set($event.target.value)" />
    <small v-if="error" class="fe__err">{{ error }}</small>
  </div>

  <!-- строка-выбор (цель QR) -->
  <div v-else-if="spec.kind === 'str' && dependent" class="fe fe--field" :class="{ 'has-error': error }">
    <label :for="uid">{{ spec.label }}</label>
    <select :id="uid" :value="modelValue ?? ''" :disabled="!dependent.length" @change="set($event.target.value || undefined)">
      <option value="">{{ dependent.length ? '- выберите -' : 'не нужно' }}</option>
      <option v-for="o in dependent" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <small v-if="error" class="fe__err">{{ error }}</small>
  </div>

  <!-- число -->
  <div v-else-if="spec.kind === 'num'" class="fe fe--field fe--num" :class="{ 'has-error': error }">
    <label :for="uid">{{ spec.label }}</label>
    <input
      :id="uid"
      type="number"
      inputmode="decimal"
      :step="spec.int ? 1 : 'any'"
      :min="spec.min"
      :max="spec.max"
      :value="modelValue ?? ''"
      @input="set($event.target.value === '' ? null : Number($event.target.value))"
    />
    <small v-if="error" class="fe__err">{{ error }}</small>
  </div>

  <!-- да/нет -->
  <label v-else-if="spec.kind === 'bool'" class="fe fe--check">
    <input type="checkbox" :checked="Boolean(modelValue)" @change="set($event.target.checked)" />
    <span>{{ spec.label }}</span>
  </label>

  <!-- выбор из списка -->
  <div v-else-if="spec.kind === 'enum' || spec.kind === 'ref'" class="fe fe--field" :class="{ 'has-error': error }">
    <label :for="uid">{{ spec.label }}</label>
    <select :id="uid" :value="modelValue ?? ''" @change="set($event.target.value || undefined)">
      <option v-if="spec.kind === 'ref'" value="">{{ spec.optional ? '- нет -' : '- выберите -' }}</option>
      <option v-for="o in spec.kind === 'ref' ? options : spec.values" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <small v-if="error" class="fe__err">{{ error }}</small>
  </div>

  <!-- объект -->
  <fieldset v-else-if="spec.kind === 'obj'" class="fe fe--obj">
    <legend v-if="spec.label">{{ spec.label }}</legend>
    <FieldEditor
      v-for="(f, key) in spec.fields"
      :key="key"
      :spec="f"
      :name="key"
      :siblings="modelValue"
      :model-value="modelValue?.[key]"
      :errors="errors"
      :path="path ? `${path}.${key}` : key"
      @update:model-value="setField(key, $event)"
    />
  </fieldset>

  <!-- блок раздела -->
  <div v-else-if="spec.kind === 'union'" class="fe fe--obj">
    <p class="fe__variant">{{ variantOf(modelValue)?.label }}</p>
    <FieldEditor
      v-for="(f, key) in variantOf(modelValue)?.fields"
      :key="key"
      :spec="f"
      :name="key"
      :model-value="modelValue?.[key]"
      :errors="errors"
      :path="`${path}.${key}`"
      @update:model-value="setField(key, $event)"
    />
  </div>

  <!-- список -->
  <fieldset v-else-if="spec.kind === 'list'" class="fe fe--list" :class="{ 'is-simple': isSimpleList, 'has-error': error }">
    <legend>{{ spec.label }} <span class="fe__count">{{ list.length }}/{{ spec.max }}</span></legend>
    <small v-if="error" class="fe__err">{{ error }}</small>
    <ol>
      <li v-for="(item, i) in list" :key="i" class="fe__item">
        <FieldEditor
          :spec="isSimpleList ? { ...spec.of, label: `${i + 1}` } : spec.of"
          :model-value="item"
          :errors="errors"
          :path="`${path}[${i}]`"
          @update:model-value="setItem(i, $event)"
        />
        <div class="fe__tools">
          <button type="button" :disabled="i === 0" aria-label="Выше" @click="move(i, -1)">↑</button>
          <button type="button" :disabled="i === list.length - 1" aria-label="Ниже" @click="move(i, 1)">↓</button>
          <button type="button" class="fe__del" aria-label="Удалить" @click="remove(i)">×</button>
        </div>
      </li>
    </ol>
    <div v-if="list.length < spec.max" class="fe__add">
      <template v-if="spec.of.kind === 'union'">
        <button v-for="(v, type) in spec.of.variants" :key="type" type="button" @click="addItem(type)">+ {{ v.label }}</button>
      </template>
      <button v-else type="button" @click="addItem()">+ Добавить</button>
    </div>
  </fieldset>
</template>

<style scoped>
.fe--field {
  display: grid;
  gap: var(--space-3xs);
}

.fe label,
.fe legend {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-ink-muted);
}

.req {
  color: var(--color-accent-ink);
  margin-left: 0.15em;
}

input[type='text'],
input[type='number'],
textarea,
select {
  width: 100%;
  min-height: 2.5rem;
  padding: var(--space-2xs) var(--space-xs);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-sm);
  background: var(--color-paper);
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-base);
}

textarea {
  resize: vertical;
  line-height: 1.45;
}

input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 0;
  border-color: transparent;
}

.has-error > input,
.has-error > textarea,
.has-error > select {
  border-color: var(--color-accent);
}

.fe__err {
  color: var(--color-accent-ink);
  font-size: var(--text-xs);
}

.fe--num input {
  max-width: 10rem;
}

.fe--check {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--text-sm);
}

.fe--check input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-forest);
}

.fe--obj {
  display: grid;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

.fe--obj > legend {
  margin-bottom: var(--space-2xs);
}

.fe__variant {
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent-ink);
}

.fe--list {
  display: grid;
  gap: var(--space-xs);
  margin: 0;
  padding: var(--space-sm);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-md);
  min-width: 0;
}

.fe--list legend {
  padding-inline: var(--space-3xs);
}

.fe__count {
  font-weight: 400;
  opacity: 0.7;
}

.fe--list ol {
  display: grid;
  gap: var(--space-xs);
}

.fe__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2xs);
  align-items: start;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  background: var(--color-paper-2);
}

.is-simple .fe__item {
  padding: 0;
  background: none;
}

.fe__tools {
  display: flex;
  gap: 2px;
}

.fe__tools button,
.fe__add button {
  min-width: 2rem;
  min-height: 2rem;
  padding: 0 var(--space-2xs);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-sm);
  background: var(--color-paper);
  font-size: var(--text-sm);
}

.fe__tools button:disabled {
  opacity: 0.35;
}

.fe__del:hover {
  border-color: var(--color-accent);
  color: var(--color-accent-ink);
}

.fe__add {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.fe__add button:hover {
  background: var(--color-peach);
}

@media (max-width: 40rem) {
  .fe__item {
    grid-template-columns: minmax(0, 1fr);
  }

  .fe__tools {
    justify-content: flex-end;
  }
}
</style>
