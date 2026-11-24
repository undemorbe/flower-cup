import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import Home from './views/HomeView.vue'
import { DEFAULT_ADMIN_PATH } from '../shared/admin-path.js'

// Админка живёт по адресу из VITE_ADMIN_PATH (проверен в vite.config.js); /admin - обычная 404
export const ADMIN_PATH = import.meta.env?.VITE_ADMIN_PATH || DEFAULT_ADMIN_PATH

// meta.parent - куда ведёт кнопка «назад», если человек пришёл на страницу напрямую (QR, поиск)
// meta.tab    - какая вкладка нижней панели подсвечена
export const routes = [
  { path: '/', name: 'home', component: Home, meta: { tab: 'home' } },
  { path: '/bouquets', name: 'bouquets', component: () => import('./views/BouquetsView.vue'), meta: { tab: 'bouquets', parent: 'home', title: 'Букеты' } },
  { path: '/bouquets/:slug', name: 'bouquet', component: () => import('./views/BouquetView.vue'), props: true, meta: { tab: 'bouquets', parent: 'bouquets', title: 'Букет' } },
  { path: '/plants', name: 'plants', component: () => import('./views/PlantsView.vue'), meta: { tab: 'plants', parent: 'home', title: 'Растения' } },
  { path: '/plants/:slug', name: 'plant', component: () => import('./views/PlantView.vue'), props: true, meta: { tab: 'plants', parent: 'plants', title: 'Растение' } },
  // Старые ссылки на семечки
  { path: '/seeds/:slug', redirect: (to) => ({ name: 'plant', params: { slug: to.params.slug } }) },
  { path: '/faq', name: 'faq', component: () => import('./views/FaqView.vue'), meta: { tab: 'faq', parent: 'home', title: 'Вопросы' } },
  { path: '/reviews', name: 'reviews', component: () => import('./views/ReviewsView.vue'), meta: { tab: 'more', parent: 'home', title: 'Отзывы' } },
  { path: '/contacts', name: 'contacts', component: () => import('./views/ContactsView.vue'), meta: { tab: 'more', parent: 'home', title: 'Контакты' } },
  { path: '/q/:code', name: 'qr', component: () => import('./views/QrView.vue'), props: true, meta: { bare: true } },
  { path: ADMIN_PATH, name: 'admin', component: () => import('./admin/AdminApp.vue'), meta: { layout: 'admin' } },
  // Разделы из админки: /about, /cups и любые новые
  { path: '/:slug', name: 'page', component: () => import('./views/PageView.vue'), props: true, meta: { tab: 'more', parent: 'home' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue'), meta: { parent: 'home', title: 'Не найдено' } },
]

// Позиции прокрутки ждут окончания анимации ухода страницы
let releaseScroll = null
export const pageLeft = () => releaseScroll?.()

export function createAppRouter(ssr = false) {
  return createRouter({
    history: ssr ? createMemoryHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, saved) {
      if (to.path === from.path) return to.hash ? { el: to.hash, behavior: 'smooth' } : false
      const target = { ...(saved ?? (to.hash ? { el: to.hash } : { top: 0 })), behavior: 'instant' }
      return new Promise((resolve) => {
        const done = () => {
          releaseScroll = null
          resolve(target)
        }
        releaseScroll = done
        setTimeout(done, 400) // на случай, если анимации не было
      })
    },
  })
}
