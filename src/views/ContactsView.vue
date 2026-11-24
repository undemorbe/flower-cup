<script setup>
import SiteFooter from '../components/SiteFooter.vue'
import { useCatalog } from '../content/store.js'
import { useSeo } from '../seo/head.js'

const { site } = useCatalog()
useSeo(() => ({
  title: 'Контакты и заказ',
  heading: 'Контакты',
  description: `Заказать букет в стаканчике: Telegram @${site.value.telegram}, телефон ${site.value.phone}. ${site.value.delivery}.`,
  path: '/contacts',
}))
</script>

<template>
  <SiteFooter as-page />
</template>
