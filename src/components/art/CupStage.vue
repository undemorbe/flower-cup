<script setup>
// Линейные пиктограммы жизни стаканчика (для тёмного фона)
defineProps({ stage: { type: Number, required: true } })
</script>

<template>
  <svg viewBox="0 0 160 150" aria-hidden="true" class="cup-stage">
    <g v-if="stage === 4">
      <line class="st-line" x1="10" y1="96" x2="150" y2="96" />
      <path class="st-dash" d="M52 96 L58 138 H102 L108 96" />
      <path class="st-soil" d="M54 96 H106 L104 110 Q80 112 56 110 Z" />
      <path class="st-line" d="M80 96 V56" />
      <path class="st-leaf" d="M80 66 C 66 64 58 54 60 44 C 72 44 80 54 80 66 Z" />
      <path class="st-leaf" d="M80 58 C 92 56 100 46 98 36 C 86 36 80 46 80 58 Z" />
      <path class="st-line" d="M24 104 l6 4 M120 106 l8 2 M38 120 l4 -2 M118 124 l6 0" />
    </g>
    <g v-else>
      <path class="st-kraft" d="M48 64 H112 L102 136 Q80 140 58 136 Z" />
      <path class="st-line" d="M48 64 H112 L102 136 Q80 140 58 136 Z" />
      <rect class="st-line" x="44" y="58" width="72" height="7" rx="3" />

      <g v-if="stage === 1">
        <path class="st-water" d="M52 84 H108 L102 134 Q80 138 58 134 Z" />
        <path class="st-line" d="M70 64 Q66 40 56 26 M80 64 V18 M90 64 Q96 42 106 30" />
        <circle class="st-head" cx="56" cy="24" r="8" />
        <circle class="st-head-alt" cx="80" cy="15" r="9" />
        <circle class="st-head" cx="106" cy="27" r="7" />
      </g>

      <g v-else-if="stage === 2">
        <path class="st-line" d="M128 30 q4 8 0 12 q-4 -4 0 -12 Z" />
        <path class="st-line" d="M118 46 q3 6 0 9 q-3 -3 0 -9 Z" />
        <path class="st-petal" d="M30 112 c6 -6 14 -4 14 2 c-6 4 -12 4 -14 -2 Z" />
        <path class="st-petal" d="M120 128 c4 -6 12 -6 14 0 c-6 4 -10 4 -14 0 Z" />
        <path class="st-dash" d="M58 50 Q80 38 102 50" />
      </g>

      <g v-else-if="stage === 3">
        <path class="st-soil" d="M51 76 H109 L102 134 Q80 138 58 134 Z" />
        <ellipse class="st-seed" cx="80" cy="44" rx="4" ry="6" transform="rotate(20 80 44)" />
        <path class="st-dash" d="M80 54 V70" />
        <rect class="st-line" x="118" y="92" width="26" height="34" rx="2" />
        <path class="st-line" d="M118 100 L131 108 L144 100" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.cup-stage { width: 100%; height: auto; overflow: visible; }
.st-line, .st-dash { fill: none; stroke: var(--color-on-forest); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.st-dash { stroke-dasharray: 3 4; opacity: 0.7; }
.st-kraft { fill: var(--color-kraft); opacity: 0.22; }
.st-water { fill: var(--color-sage-soft); opacity: 0.45; }
.st-soil { fill: var(--color-kraft-dark); }
.st-head { fill: var(--color-petal); }
.st-head-alt { fill: var(--color-kraft); }
.st-petal { fill: var(--color-petal); opacity: 0.8; }
.st-seed { fill: var(--color-kraft); }
.st-leaf { fill: var(--color-sage-soft); stroke: var(--color-on-forest); stroke-width: 1.2; }
</style>
