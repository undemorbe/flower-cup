// MIT и SIL OFL требуют передавать уведомление об авторских правах вместе с кодом.
// Минификатор вырезает комментарии, поэтому кладём лицензии всех runtime-зависимостей
// отдельным файлом рядом с сайтом: /third-party-licenses.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const { dependencies } = JSON.parse(readFileSync('package.json', 'utf8'))

// У некоторых пакетов нет отдельного файла лицензии - только заголовок в исходнике.
// Для них держим полный текст MIT с их копирайтом.
const MIT = (holder) => `MIT License

${holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
const KNOWN = {
  'qrcode-generator': MIT('Copyright (c) 2009 Kazuhiko Arase'),
}

const sections = Object.keys(dependencies)
  .sort()
  .map((name) => {
    const dir = join('node_modules', name)
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const file = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f))
    if (!file && !KNOWN[name]) throw new Error(`Не найден файл лицензии у ${name}`)
    const text = file ? readFileSync(join(dir, file), 'utf8').trim() : KNOWN[name]
    return `${name}@${pkg.version} (${pkg.license})\n${'='.repeat(60)}\n\n${text}`
  })

const header = [
  'Сторонние компоненты сайта Flower Cup / Third-party components of the Flower Cup website',
  'Подробнее / Details: THIRD_PARTY_NOTICES.md',
].join('\n')

writeFileSync('dist/third-party-licenses.txt', `${header}\n\n\n${sections.join('\n\n\n')}\n`)
