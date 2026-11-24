<script setup>
import SeedsSection from '../components/SeedsSection.vue'
import { useCatalog } from '../content/store.js'
import { useSeo, ld } from '../seo/head.js'

const { plants } = useCatalog()
useSeo(() => ({
  title: 'Растения и семена',
  heading: 'Растения',
  description: `Что можно вырастить в стаканчике Flower Cup: ${plants.value.map((p) => p.name.toLowerCase()).join(', ')}. Инструкции по посадке.`,
  path: '/plants',
  jsonLd: [ld.breadcrumbs([{ name: 'Главная', path: '/' }, { name: 'Растения', path: '/plants' }])],
}))
</script>

<template>
  <SeedsSection as-page />
</template>
