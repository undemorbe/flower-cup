// После правок в админке просим GitHub Actions пересобрать сайт, чтобы обновились
// статические страницы для поисковиков. Правки идут пачками, поэтому ждём паузу.
export function createRebuildTrigger(rebuild, fetchImpl = fetch) {
  if (!rebuild) return () => {}
  let timer = null
  return () => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      try {
        const res = await fetchImpl(
          `https://api.github.com/repos/${rebuild.repo}/actions/workflows/${rebuild.workflow}/dispatches`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${rebuild.token}`,
              accept: 'application/vnd.github+json',
              'x-github-api-version': '2022-11-28',
              'content-type': 'application/json',
            },
            body: JSON.stringify({ ref: rebuild.ref }),
          },
        )
        if (!res.ok) console.warn(`Пересборка сайта не запустилась: GitHub ответил ${res.status}`)
        else console.log('Запущена пересборка сайта')
      } catch (err) {
        console.warn('Пересборка сайта не запустилась:', err.message)
      }
    }, rebuild.delayMs)
    timer.unref?.()
  }
}
