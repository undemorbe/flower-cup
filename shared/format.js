// Мелкие чистые функции, которые нужны и сайту, и сборке, и бэкенду

export const formatPrice = (price) => (price == null ? 'Цена уточняется' : `${price} ₽`)

export const sproutLabel = (p) => (p.sproutMin === p.sproutMax ? `${p.sproutMin} дн.` : `${p.sproutMin}–${p.sproutMax} дней`)

// Куда ведёт QR-код: путь внутри сайта (без base). Внешних адресов нет намеренно -
// QR не должен превращаться в открытый редирект.
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function qrTargetPath(target) {
  if (target?.type !== 'home' && !SAFE_SLUG.test(target?.slug ?? '')) return '/'
  switch (target?.type) {
    case 'plant':
      return `/plants/${target.slug}`
    case 'bouquet':
      return `/bouquets/${target.slug}`
    case 'page':
      return `/${target.slug}`
    default:
      return '/'
  }
}

export const telegramLink = (username, text) =>
  `https://t.me/${username}${text ? `?text=${encodeURIComponent(text)}` : ''}`

const DAY = 24 * 60 * 60 * 1000

// Прогресс посадки: сколько дней прошло и чего ждать
export function plantingStatus(plant, sownAt, now = Date.now()) {
  if (!sownAt || !plant) return null
  const day = Math.max(0, Math.floor((now - sownAt) / DAY))
  let stage
  if (day < plant.sproutMin) stage = 'waiting'
  else if (day <= plant.sproutMax) stage = 'sprouting'
  else stage = 'late'
  return {
    day,
    stage,
    daysToMin: Math.max(0, plant.sproutMin - day),
    progress: Math.min(1, day / plant.sproutMax),
  }
}

// Склонение: 1 день, 2 дня, 5 дней
export function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}
