<script setup>
// Крафтовый стаканчик: верхний край на y=140, дно на y=228 (viewBox 200×240)
defineProps({ stamp: { type: Boolean, default: true } })
</script>

<template>
  <g>
    <path class="a-kraft" d="M54 140 H146 L133 228 Q100 232 67 228 Z" />
    <g>
      <line v-for="i in 9" :key="i" class="a-fiber" :x1="58 + i * 9" y1="146" :x2="66 + i * 7.2" y2="224" />
    </g>
    <path class="a-kraft-shade" d="M118 140 H146 L133 228 Q124 229.5 112 230 Z" />
    <rect class="a-kraft-deep" x="50" y="134" width="100" height="10" rx="4" />
    <g v-if="stamp" transform="translate(100 186)">
      <circle class="a-stamp" r="19" />
      <circle class="a-stamp" r="15.5" stroke-dasharray="1.5 2" />
      <path class="a-stamp" d="M0 9 V-7 M0 -1 C-6 -3 -7 -9 -6 -11 C-2 -10 0 -6 0 -1 M0 3 C6 1 8 -5 7 -8 C3 -7 0 -3 0 3" />
    </g>
  </g>
</template>
