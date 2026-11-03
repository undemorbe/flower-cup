// MIT и SIL OFL требуют передавать уведомление об авторских правах вместе с кодом.
// Минификатор вырезает комментарии, поэтому кладём лицензии всех runtime-зависимостей
// отдельным файлом рядом с сайтом: /third-party-licenses.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const { dependencies } = JSON.parse(readFileSync('package.json', 'utf8'))

const sections = Object.keys(dependencies)
  .sort()
  .map((name) => {
    const dir = join('node_modules', name)
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const file = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f))
    if (!file) throw new Error(`Не найден файл лицензии у ${name}`)
    const text = readFileSync(join(dir, file), 'utf8').trim()
    return `${name}@${pkg.version} (${pkg.license})\n${'='.repeat(60)}\n\n${text}`
  })

const header = [
  'Сторонние компоненты сайта Flower Cup / Third-party components of the Flower Cup website',
  'Подробнее / Details: THIRD_PARTY_NOTICES.md',
].join('\n')

writeFileSync('dist/third-party-licenses.txt', `${header}\n\n\n${sections.join('\n\n\n')}\n`)
