<script setup>
// /q/<код> - короткая ссылка с QR-кода. Ищем код в каталоге и уводим на страницу цели.
// Если подключён бэкенд, он посчитает переход. Без бэкенда работает по встроенным данным.
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Missing from '../components/Missing.vue'
import { useCatalog, loadContent, API_URL } from '../content/store.js'
import { qrTargetPath } from '../../shared/format.js'
import { QR_CODE, specs, validate } from '../../shared/schema.js'
import { useSeo } from '../seo/head.js'

const props = defineProps({ code: { type: String, required: true } })
const router = useRouter()
const { findQr } = useCatalog()
const missing = ref(false)

useSeo(() => ({ title: 'Переход по QR-коду', heading: '', noindex: true }))

async function resolve(code) {
  if (!QR_CODE.test(code) || code.length > 32) return null
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/qr/${code}`, { credentials: 'omit' })
      if (res.ok) {
        const data = await res.json()
        // Ответу API доверяем не больше, чем localStorage: цель проходит ту же схему
        const checked = validate(specs.qr.fields.target, data?.target)
        if (checked.ok) return checked.value
      }
    } catch {
      /* бэкенд недоступен - ищем во встроенных данных */
    }
    await loadContent()
  }
  return findQr(code)?.target ?? null
}

onMounted(async () => {
  const code = props.code.toLowerCase()
  const target = await resolve(code)
  if (!target) {
    missing.value = true
    return
  }
  router.replace({ path: qrTargetPath(target), query: { from: 'qr' } })
})
</script>

<template>
  <Missing v-if="missing" what="QR-код не найден" :back="{ name: 'plants' }" back-label="Все растения" />
  <p v-else class="qr-wait wrap">Открываем…</p>
</template>

<style scoped>
.qr-wait {
  padding-block: var(--space-3xl);
  font-size: var(--text-md);
  color: var(--color-ink-muted);
}
</style>
