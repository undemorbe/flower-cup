<script setup>
import BouquetsSection from '../components/BouquetsSection.vue'
import { useCatalog } from '../content/store.js'
import { useSeo, ld } from '../seo/head.js'

const { bouquets } = useCatalog()
useSeo(() => ({
  title: 'Букеты в крафтовых стаканчиках',
  heading: 'Букеты',
  description: `${bouquets.value.map((b) => b.name).join(', ')}. Каждый букет - в биоразлагаемом стаканчике с семечком на дне.`,
  path: '/bouquets',
  jsonLd: [ld.breadcrumbs([{ name: 'Главная', path: '/' }, { name: 'Букеты', path: '/bouquets' }])],
}))
</script>

<template>
  <BouquetsSection as-page />
</template>
