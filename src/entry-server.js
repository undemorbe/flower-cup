// Пререндер: превращает маршрут в готовый HTML с мета-тегами (для поисковиков и быстрого первого экрана)
import { renderToString } from 'vue/server-renderer'
import { createFlowerApp } from './app.js'
import { setContent } from './content/store.js'
import { head, buildHead, renderHeadTags } from './seo/head.js'

export async function render(url, content) {
  setContent(content, 'snapshot')
  head.current = null
  const { app, router } = createFlowerApp({ ssr: true })
  await router.push(url)
  await router.isReady()
  const html = await renderToString(app)
  const page = head.current ?? {}
  return {
    html,
    head: renderHeadTags(buildHead(page, content.site)),
    notFound: router.currentRoute.value.name === 'not-found' || /не найден/i.test(page.title ?? ''),
  }
}

export { publicView, validateContent } from '../shared/schema.js'
