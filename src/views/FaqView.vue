<script setup>
import FaqSection from '../components/FaqSection.vue'
import { useCatalog } from '../content/store.js'
import { useSeo, ld } from '../seo/head.js'

const { faq } = useCatalog()
useSeo(() => ({
  title: 'Вопросы и ответы',
  heading: 'Вопросы',
  description: 'Как ухаживать за букетом в стаканчике, что делать с ним потом, как выбрать семечко и оформить заказ.',
  path: '/faq',
  jsonLd: faq.value.length ? [ld.faq(faq.value)] : [],
}))
</script>

<template>
  <FaqSection as-page />
</template>
