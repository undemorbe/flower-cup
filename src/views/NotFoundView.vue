<script setup>
// Неизвестный адрес. Пререндер кладёт эту страницу в dist/404.html - её отдают
// GitHub Pages и nginx, а приложение поверх ещё раз проверяет маршрут
// (раздел или QR-код могли появиться в API уже после сборки).
import Missing from '../components/Missing.vue'
import { useSeo } from '../seo/head.js'

useSeo(() => ({ title: 'Страница не найдена', heading: 'Не найдено', noindex: true }))
</script>

<template>
  <Missing />
</template>
