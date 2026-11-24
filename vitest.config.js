import { defineConfig } from 'vitest/config'

// Отдельно от vite.config.js: тестам не нужны плагины сборки и CSP
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
})
