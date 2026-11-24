import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { readConfig } from './config.js'
import { ContentStore } from './store.js'
import { createHandler } from './app.js'
import { createRebuildTrigger } from './rebuild.js'

const config = readConfig()
const seed = JSON.parse(readFileSync(new URL('../shared/seed-content.json', import.meta.url), 'utf8'))
const store = await new ContentStore(config.dataDir, seed).init()

const server = createServer(createHandler({ store, config, onChange: createRebuildTrigger(config.rebuild) }))
server.requestTimeout = 15_000
server.headersTimeout = 10_000

server.listen(config.port, config.host, () => {
  console.log(`Flower Cup API: http://${config.host}:${config.port}  (ревизия ${store.revision})`)
  if (!config.passwordHash) console.warn('Админка выключена: задайте ADMIN_PASSWORD_HASH и SESSION_SECRET (npm run admin:hash)')
  if (!config.allowedOrigins.length) console.warn('ALLOWED_ORIGINS пуст: админка из браузера работать не будет')
})

async function shutdown() {
  server.close()
  await store.flushStats().catch(() => {})
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
