// Настройки бэкенда из переменных окружения (см. server/.env.example)
import { resolve } from 'node:path'

export function readConfig(env = process.env) {
  const secret = env.SESSION_SECRET ?? ''
  if (env.ADMIN_PASSWORD_HASH && secret.length < 32) {
    throw new Error('SESSION_SECRET должен быть не короче 32 символов (например: openssl rand -base64 48)')
  }
  const origins = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  for (const o of origins) {
    const u = new URL(o)
    if (u.origin !== o) throw new Error(`ALLOWED_ORIGINS: укажите только origin без пути - ${u.origin}`)
  }
  return {
    port: Number(env.PORT ?? 8787),
    host: env.HOST ?? '127.0.0.1',
    dataDir: resolve(env.DATA_DIR ?? 'server/data'),
    passwordHash: env.ADMIN_PASSWORD_HASH ?? '',
    sessionSecret: secret,
    sessionTtlMs: Number(env.SESSION_TTL_HOURS ?? 12) * 60 * 60 * 1000,
    allowedOrigins: origins,
    trustProxy: env.TRUST_PROXY === '1',
    // Пересборка статического сайта после правок (необязательно)
    rebuild: env.GITHUB_TOKEN && env.GITHUB_REPO
      ? { token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO, workflow: env.GITHUB_WORKFLOW ?? 'deploy.yml', ref: env.GITHUB_REF ?? 'main', delayMs: Number(env.REBUILD_DELAY_SEC ?? 120) * 1000 }
      : null,
  }
}
