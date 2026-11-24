import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { existsSync } from 'node:fs'
import { resolveAdminPath } from './shared/admin-path.js'

// Адрес сайта для canonical, Open Graph и sitemap. В CI можно переопределить (свой домен).
process.env.VITE_SITE_URL ||= 'https://undemorbe.github.io/flower-cup'

// Картинку для соцсетей подключаем, только если она есть (public/og.png, 1200x630)
process.env.VITE_OG_IMAGE = existsSync(new URL('./public/og.png', import.meta.url)) ? '/og.png' : ''

// Секретный адрес админки: проверяем при сборке, чтобы опечатка не сломала маршрут
process.env.VITE_ADMIN_PATH = resolveAdminPath(process.env.VITE_ADMIN_PATH)

// Бэкенд необязателен: без VITE_API_URL сайт работает на встроенных данных
const apiOrigin = (() => {
  try {
    return process.env.VITE_API_URL ? new URL(process.env.VITE_API_URL).origin : ''
  } catch {
    throw new Error('VITE_API_URL должен быть полным адресом, например https://api.example.ru')
  }
})()

// GitHub Pages не умеет отдавать свои заголовки, поэтому политику безопасности
// кладём в <meta>. Только в сборке: dev-сервер Vite вставляет инлайн-стили и HMR.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityMeta = {
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
  ],
}

// BASE_PATH задаётся в CI (/<repo>/ для GitHub Pages), локально - корень
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [vue(), securityMeta],
  // three.js грузится лениво, отдельным чанком
  build: { chunkSizeWarningLimit: 700 },
})
