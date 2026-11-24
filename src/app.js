import { createApp, createSSRApp } from 'vue'
import App from './App.vue'
import { createAppRouter } from './router.js'
import { reveal } from './composables/reveal.js'

// Общая сборка приложения для браузера и для пререндера страниц
export function createFlowerApp({ ssr = false } = {}) {
  const app = ssr ? createSSRApp(App) : createApp(App)
  const router = createAppRouter(ssr)
  app.use(router).directive('reveal', reveal)
  return { app, router }
}
