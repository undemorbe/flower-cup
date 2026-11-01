<script setup>
defineProps({
  legend: { type: String, required: true },
  name: { type: String, required: true },
  options: { type: Array, required: true }, // { value, label, hint? }
})
const model = defineModel({ type: String, default: null })
</script>

<template>
  <fieldset class="chips">
    <legend>{{ legend }}</legend>
    <div class="chips__row">
      <label v-for="o in options" :key="o.value" class="chip">
        <input v-model="model" type="radio" :name="name" :value="o.value" />
        <span class="chip__face">
          {{ o.label }}
          <small v-if="o.hint">{{ o.hint }}</small>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.chips {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

legend {
  padding: 0;
  margin-bottom: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 500;
}

.chips__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.chip__face {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2xs);
  min-height: 2.5rem;
  padding: var(--space-2xs) var(--space-sm);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-pill);
  background: var(--color-paper);
  font-size: var(--text-sm);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.chip__face small {
  font-size: var(--text-xs);
  color: var(--color-accent-ink);
}

.chip:hover .chip__face {
  border-color: var(--color-ink);
}

.chip input:focus-visible + .chip__face {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.chip input:checked + .chip__face {
  border-color: var(--color-forest);
  background: var(--color-forest);
  color: var(--color-on-forest);
}

.chip input:checked + .chip__face small {
  color: var(--color-peach);
}

.chip input:disabled + .chip__face {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
