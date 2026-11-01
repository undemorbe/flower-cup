import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// BASE_PATH задаётся в CI (/<repo>/ для GitHub Pages), локально — корень
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [vue()],
  // three.js грузится лениво и только на десктопе
  build: { chunkSizeWarningLimit: 700 },
})
