<script setup>
import { computed } from 'vue'
import { qrUrl, qrMatrix, qrPath, qrSvgString, qrPngBlob, download } from './qr.js'

const props = defineProps({
  code: { type: String, required: true },
  label: { type: String, default: '' },
  scans: { type: Object, default: null },
})

const url = computed(() => qrUrl(props.code))
const path = computed(() => {
  try {
    return qrPath(qrMatrix(url.value))
  } catch {
    return null
  }
})

const saveSvg = () => download(new Blob([qrSvgString(url.value)], { type: 'image/svg+xml' }), `flowercup-qr-${props.code}.svg`)
const savePng = async () => download(await qrPngBlob(url.value), `flowercup-qr-${props.code}.png`)
</script>

<template>
  <figure class="qrc">
    <svg v-if="path" :viewBox="`0 0 ${path.size} ${path.size}`" shape-rendering="crispEdges" role="img" :aria-label="`QR-код ${url}`">
      <rect :width="path.size" :height="path.size" class="qrc__bg" />
      <path :d="path.d" class="qrc__fg" />
    </svg>
    <figcaption>
      <a class="qrc__url" :href="url" target="_blank" rel="noopener">{{ url }}</a>
      <span v-if="scans" class="qrc__scans num">Переходов: {{ scans.scans }}</span>
      <span class="qrc__actions">
        <button type="button" @click="saveSvg">SVG для печати</button>
        <button type="button" @click="savePng">PNG</button>
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.qrc {
  display: grid;
  grid-template-columns: 7rem minmax(0, 1fr);
  gap: var(--space-sm);
  align-items: center;
  margin: 0;
}

.qrc svg {
  width: 100%;
  border-radius: var(--radius-sm);
}

.qrc__bg {
  fill: var(--color-petal);
}

.qrc__fg {
  fill: var(--color-forest-deep);
}

figcaption {
  display: grid;
  gap: var(--space-2xs);
  font-size: var(--text-sm);
  min-width: 0;
}

.qrc__url {
  overflow-wrap: anywhere;
}

.qrc__scans {
  color: var(--color-ink-muted);
}

.qrc__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.qrc__actions button {
  min-height: 2rem;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-pill);
  background: var(--color-paper);
  font-size: var(--text-xs);
}

.qrc__actions button:hover {
  background: var(--color-peach);
}
</style>
