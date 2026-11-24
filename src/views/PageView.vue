<script setup>
import { computed } from 'vue'
import PageBlocks from '../components/PageBlocks.vue'
import Missing from '../components/Missing.vue'
import { useCatalog } from '../content/store.js'
import { useSeo, ld } from '../seo/head.js'

// Любой раздел из админки: /about, /cups, /<новый-раздел>
const props = defineProps({ slug: { type: String, required: true } })
const { findPage } = useCatalog()
const page = computed(() => findPage(props.slug))

useSeo(() => {
  const p = page.value
  if (!p) return { title: 'Страница не найдена', heading: 'Не найдено', noindex: true }
  return {
    title: p.title,
    description: p.seoDescription || p.lead,
    path: `/${p.slug}`,
    jsonLd: [ld.breadcrumbs([{ name: 'Главная', path: '/' }, { name: p.title, path: `/${p.slug}` }])],
  }
})
</script>

<template>
  <article v-if="page">
    <header class="page-head wrap">
      <h1>{{ page.title }}</h1>
      <p v-if="page.lead">{{ page.lead }}</p>
    </header>
    <PageBlocks :blocks="page.blocks" />
  </article>
  <Missing v-else />
</template>
