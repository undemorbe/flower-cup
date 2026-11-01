import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/bouquets/:slug', name: 'bouquet', component: () => import('./views/BouquetView.vue'), props: true },
    { path: '/seeds/:slug', name: 'seed', component: () => import('./views/SeedView.vue'), props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
