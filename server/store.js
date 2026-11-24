// Хранилище контента: один JSON-файл, атомарная запись, резервные копии.
// Для микро-бэкенда этого хватает; интерфейс позволяет позже заменить файл на БД.
import { readFile, writeFile, rename, mkdir, readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { validateContent } from '../shared/schema.js'
import { applyChange } from '../shared/mutations.js'

const BACKUPS = 30

export class ContentStore {
  constructor(dir, seed) {
    this.dir = dir
    this.file = join(dir, 'content.json')
    this.statsFile = join(dir, 'stats.json')
    this.seed = seed
    this.state = null // { revision, updatedAt, content }
    this.stats = { qr: {} }
    this.queue = Promise.resolve()
    this.statsTimer = null
  }

  async init() {
    await mkdir(join(this.dir, 'backups'), { recursive: true })
    try {
      const raw = JSON.parse(await readFile(this.file, 'utf8'))
      const checked = validateContent(raw.content)
      if (!checked.ok) throw new Error(`content.json не проходит схему: ${checked.errors[0]?.message}`)
      this.state = { revision: raw.revision ?? 1, updatedAt: raw.updatedAt ?? null, content: checked.value }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      const checked = validateContent(this.seed)
      if (!checked.ok) throw new Error('Стартовый контент не проходит схему')
      this.state = { revision: 1, updatedAt: new Date().toISOString(), content: checked.value }
      await this.#write()
    }
    try {
      const stats = JSON.parse(await readFile(this.statsFile, 'utf8'))
      if (stats?.qr && typeof stats.qr === 'object') this.stats = { qr: stats.qr }
    } catch {
      /* статистики ещё нет */
    }
    return this
  }

  get revision() {
    return this.state.revision
  }

  get content() {
    return this.state.content
  }

  async #write() {
    const tmp = `${this.file}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(this.state, null, 2), { mode: 0o600 })
    await rename(tmp, this.file)
  }

  async #backup() {
    const name = `content-r${this.state.revision}-${Date.now()}.json`
    await writeFile(join(this.dir, 'backups', name), JSON.stringify(this.state), { mode: 0o600 })
    const files = (await readdir(join(this.dir, 'backups'))).filter((f) => f.endsWith('.json')).sort()
    for (const f of files.slice(0, Math.max(0, files.length - BACKUPS))) await unlink(join(this.dir, 'backups', f))
  }

  // Изменения выполняются строго по очереди; revision защищает от затирания чужих правок
  apply(change, expectedRevision) {
    const run = async () => {
      if (expectedRevision !== undefined && expectedRevision !== this.state.revision) {
        return { ok: false, status: 409, error: 'Данные уже изменили в другой вкладке - обновите страницу', details: [] }
      }
      const result = applyChange(this.state.content, change)
      if (!result.ok) return result
      await this.#backup()
      this.state = { revision: this.state.revision + 1, updatedAt: new Date().toISOString(), content: result.content }
      await this.#write()
      return { ok: true, revision: this.state.revision }
    }
    const next = this.queue.then(run, run)
    this.queue = next.catch(() => {})
    return next
  }

  countScan(code) {
    const s = this.stats.qr[code] ?? { scans: 0, last: null }
    this.stats.qr[code] = { scans: s.scans + 1, last: new Date().toISOString() }
    clearTimeout(this.statsTimer)
    this.statsTimer = setTimeout(() => this.flushStats(), 2000)
  }

  async flushStats() {
    clearTimeout(this.statsTimer)
    const tmp = `${this.statsFile}.tmp`
    await writeFile(tmp, JSON.stringify(this.stats), { mode: 0o600 })
    await rename(tmp, this.statsFile)
  }
}
