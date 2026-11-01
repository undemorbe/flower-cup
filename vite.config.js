import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages не умеет отдавать свои заголовки, поэтому политику безопасности
// кладём в <meta>. Только в сборке: dev-сервер Vite вставляет инлайн-стили и HMR.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
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
