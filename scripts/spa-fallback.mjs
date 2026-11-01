// GitHub Pages не умеет SPA-роутинг: отдаём index.html и на 404,
// чтобы прямые ссылки вида /bouquets/lavender открывались.
import { copyFileSync, writeFileSync } from 'node:fs'

copyFileSync('dist/index.html', 'dist/404.html')
writeFileSync('dist/.nojekyll', '')
