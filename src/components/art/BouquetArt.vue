<script setup>
import { computed } from 'vue'
import Flower from './Flower.vue'
import KraftCup from './KraftCup.vue'

const props = defineProps({
  art: { type: Array, required: true },
  label: { type: String, default: '' },
})

// Стебли сходятся в горловину стаканчика
const stems = computed(() =>
  props.art.map((f) => {
    const bx = 100 + (f.x - 100) * 0.3
    const cx = 100 + (f.x - 100) * 0.7
    return `M${bx} 150 Q${cx} ${(f.y + 150) / 2 + 12} ${f.x} ${f.y}`
  }),
)
</script>

<template>
  <svg viewBox="0 -24 200 264" role="img" :aria-label="label">
    <path v-for="(d, i) in stems" :key="i" class="a-stem" :d="d" />
    <Flower v-for="(f, i) in art" :key="'f' + i" v-bind="f" />
    <KraftCup />
  </svg>
</template>
