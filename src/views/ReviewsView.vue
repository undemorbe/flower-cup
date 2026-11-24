<script setup>
import ReviewsSection from '../components/ReviewsSection.vue'
import { useSeo } from '../seo/head.js'

useSeo(() => ({
  title: 'Отзывы',
  description: 'Отзывы о букетах Flower Cup в крафтовых стаканчиках с семенами.',
  path: '/reviews',
}))
</script>

<template>
  <ReviewsSection as-page class="reviews-page" />
</template>

<style scoped>
.reviews-page {
  padding-bottom: var(--space-3xl);
}
</style>
