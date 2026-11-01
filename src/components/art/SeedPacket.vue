<script setup>
import { computed } from 'vue'
import Flower from './Flower.vue'

const props = defineProps({
  plant: { type: String, required: true },
  label: { type: String, default: '' },
})

// Композиции растений в окошке пакетика; stem: true — тянуть стебель от земли
const compositions = {
  basil: [
    { type: 'basil', x: 62, y: 134, s: 1.1, r: -22 },
    { type: 'basil', x: 98, y: 134, s: 1.1, r: 22 },
    { type: 'basil', x: 80, y: 136, s: 1.7 },
  ],
  sunflower: [
    { type: 'leaf', x: 80, y: 124, s: 0.85, r: -55 },
    { type: 'leaf', x: 80, y: 112, s: 0.75, r: 55 },
    { type: 'sunflower', x: 80, y: 82, s: 1.05, stem: true },
  ],
  daisy: [
    { type: 'daisy', x: 62, y: 86, s: 1, stem: true },
    { type: 'daisy', x: 86, y: 68, s: 1.1, stem: true },
    { type: 'daisy', x: 104, y: 96, s: 0.9, stem: true },
  ],
  lavender: [
    { type: 'lavender', x: 64, y: 112, s: 1, r: -12, stem: true },
    { type: 'lavender', x: 80, y: 100, s: 1.1, stem: true },
    { type: 'lavender', x: 96, y: 112, s: 1, r: 12, stem: true },
  ],
  cornflower: [
    { type: 'leaf', x: 80, y: 136, s: 0.7, r: -28 },
    { type: 'leaf', x: 80, y: 136, s: 0.6, r: 30 },
    { type: 'cornflower', x: 66, y: 80, s: 1.1, stem: true },
    { type: 'cornflower', x: 98, y: 92, s: 1, stem: true },
  ],
  nasturtium: [
    { type: 'padleaf', x: 62, y: 134, s: 1.1 },
    { type: 'padleaf', x: 100, y: 130, s: 0.95 },
    { type: 'nasturtium', x: 82, y: 88, s: 1.35, stem: true },
  ],
}

const items = computed(() => compositions[props.plant] ?? [])
const stems = computed(() =>
  items.value
    .filter((f) => f.stem)
    .map((f) => `M80 138 Q${(80 + f.x) / 2} ${(138 + f.y) / 2 + 6} ${f.x} ${f.y}`),
)
</script>

<template>
  <svg viewBox="0 0 160 200" role="img" :aria-label="label">
    <path
      class="a-kraft"
      d="M14 30 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 V190 H14 Z"
    />
    <path class="a-kraft-shade" d="M112 30 L146 30 V190 H112 Z" />
    <line v-for="i in 7" :key="i" class="a-fiber" :x1="14 + i * 17" y1="34" :x2="10 + i * 18" y2="188" />
    <rect class="a-paper" x="30" y="44" width="100" height="100" rx="50" ry="50" />
    <rect class="a-soil" x="44" y="136" width="72" height="4" rx="2" opacity=".5" />
    <path v-for="(d, i) in stems" :key="'s' + i" class="a-stem" :d="d" />
    <Flower v-for="(f, i) in items" :key="i" :type="f.type" :x="f.x" :y="f.y" :s="f.s" :r="f.r ?? 0" />
    <text class="a-stamp-text" x="80" y="166" text-anchor="middle">семена · Flower Cup</text>
    <g class="a-stamp-fill">
      <ellipse cx="70" cy="178" rx="2" ry="1.2" transform="rotate(20 70 178)" />
      <ellipse cx="80" cy="180" rx="2" ry="1.2" transform="rotate(-30 80 180)" />
      <ellipse cx="90" cy="177" rx="2" ry="1.2" transform="rotate(10 90 177)" />
    </g>
  </svg>
</template>
