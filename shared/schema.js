// Схема контента Flower Cup. Один источник правды для трёх мест:
// - бэкенд проверяет всё, что приходит из админки;
// - фронт проверяет то, что пришло из API или localStorage (демо-режим);
// - админка строит по этим же описаниям формы редактирования.
//
// Валидатор возвращает очищенную копию: неизвестные поля отбрасываются,
// строки обрезаются, управляющие символы вычищаются.

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const QR_CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const TELEGRAM = /^[A-Za-z0-9_]{5,32}$/
export const EMAIL = /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/

// Адреса, которые заняты собственными страницами приложения
export const RESERVED_SLUGS = [
  'admin', 'api', 'q', 'bouquets', 'plants', 'seeds', 'faq', 'reviews', 'contacts',
  'assets', 'index', '404', 'sitemap', 'robots', 'favicon', 'manifest', 'og',
]

export const FLOWER_TYPES = [
  'daisy', 'sunflower', 'rose', 'cornflower', 'lavender', 'lagurus', 'tansy',
  'gyps', 'eucalyptus', 'leaf', 'basil', 'nasturtium', 'padleaf',
]
export const PLANT_ART = ['basil', 'sunflower', 'daisy', 'lavender', 'cornflower', 'nasturtium']
export const STAGE_ART = [
  { value: 'water', label: 'Стаканчик с водой' },
  { value: 'faded', label: 'Букет отцвёл' },
  { value: 'seed', label: 'Семечко на дне' },
  { value: 'ground', label: 'Росток в земле' },
]
export const CTA_TARGETS = [
  { value: 'home', label: 'Главная' },
  { value: 'bouquets', label: 'Букеты' },
  { value: 'plants', label: 'Растения' },
  { value: 'faq', label: 'Вопросы' },
  { value: 'reviews', label: 'Отзывы' },
  { value: 'contacts', label: 'Контакты' },
]
export const QR_TARGET_TYPES = [
  { value: 'plant', label: 'Растение' },
  { value: 'bouquet', label: 'Букет' },
  { value: 'page', label: 'Раздел' },
  { value: 'home', label: 'Главная' },
]

// ---------- описания полей ----------

export const t = {
  str: (o = {}) => ({ kind: 'str', max: 200, ...o }),
  text: (o = {}) => ({ kind: 'str', max: 2000, multiline: true, ...o }),
  num: (o = {}) => ({ kind: 'num', ...o }),
  bool: (o = {}) => ({ kind: 'bool', ...o }),
  enum: (values, o = {}) => ({
    kind: 'enum',
    values: values.map((v) => (typeof v === 'string' ? { value: v, label: v } : v)),
    ...o,
  }),
  ref: (collection, o = {}) => ({ kind: 'ref', collection, ...o }),
  list: (of, o = {}) => ({ kind: 'list', of, max: 50, ...o }),
  obj: (fields, o = {}) => ({ kind: 'obj', fields, ...o }),
  union: (variants, o = {}) => ({ kind: 'union', variants, ...o }),
}

const heading = () => t.str({ label: 'Заголовок блока', optional: true, max: 160 })

const blockVariants = {
  statement: {
    label: 'Крупная фраза',
    fields: {
      text: t.text({ label: 'Текст', max: 400 }),
      accent: t.str({ label: 'Слово-акцент (рукописным шрифтом)', optional: true, max: 40 }),
    },
  },
  text: {
    label: 'Текст',
    fields: {
      heading: heading(),
      text: t.text({ label: 'Текст (абзацы через пустую строку)', max: 4000 }),
    },
  },
  points: {
    label: 'Тезисы',
    fields: {
      heading: heading(),
      items: t.list(
        t.obj({ title: t.str({ label: 'Тезис', max: 120 }), text: t.text({ label: 'Пояснение', max: 400 }) }),
        { label: 'Тезисы', max: 12, min: 1 },
      ),
    },
  },
  stages: {
    label: 'Этапы со схемами',
    fields: {
      heading: heading(),
      lead: t.text({ label: 'Подводка', optional: true, max: 400 }),
      items: t.list(
        t.obj({
          title: t.str({ label: 'Этап', max: 120 }),
          text: t.text({ label: 'Описание', max: 600 }),
          note: t.str({ label: 'Рукописная пометка', optional: true, max: 60 }),
          art: t.enum(STAGE_ART, { label: 'Схема' }),
        }),
        { label: 'Этапы', max: 8, min: 1 },
      ),
    },
  },
  cta: {
    label: 'Кнопка-ссылка',
    fields: {
      label: t.str({ label: 'Текст кнопки', max: 60 }),
      to: t.enum(CTA_TARGETS, { label: 'Куда ведёт' }),
    },
  },
}

export const specs = {
  site: t.obj({
    name: t.str({ label: 'Название', max: 60 }),
    tagline: t.str({ label: 'Слоган', max: 120 }),
    telegram: t.str({ label: 'Telegram (без @)', pattern: TELEGRAM }),
    phone: t.str({ label: 'Телефон', max: 40, pattern: /^[+\d\s()-]{5,40}$/ }),
    email: t.str({ label: 'Почта', max: 120, pattern: EMAIL }),
    delivery: t.str({ label: 'Доставка', max: 200 }),
    seoTitle: t.str({ label: 'SEO: заголовок главной', max: 70 }),
    seoDescription: t.str({ label: 'SEO: описание главной', max: 200 }),
    reviewsNote: t.str({ label: 'Пометка над отзывами', optional: true, max: 200, default: '' }),
    bouquetCare: t.list(t.str({ label: 'Шаг', max: 300 }), { label: 'Общий уход за букетом', max: 12 }),
  }),

  pages: t.obj({
    slug: t.str({ label: 'Адрес', pattern: SLUG, max: 60, notIn: RESERVED_SLUGS, key: true }),
    title: t.str({ label: 'Заголовок', max: 160 }),
    menuLabel: t.str({ label: 'Название в меню', max: 40 }),
    lead: t.text({ label: 'Подводка', optional: true, max: 400 }),
    seoDescription: t.str({ label: 'SEO: описание', optional: true, max: 200 }),
    inMenu: t.bool({ label: 'Показывать в меню', default: true }),
    published: t.bool({ label: 'Опубликован', default: true }),
    blocks: t.list(t.union(blockVariants), { label: 'Блоки', max: 30 }),
  }),

  bouquets: t.obj({
    slug: t.str({ label: 'Адрес', pattern: SLUG, max: 60, key: true }),
    name: t.str({ label: 'Название', max: 80 }),
    size: t.str({ label: 'Размер', max: 60 }),
    price: t.num({ label: 'Цена, ₽ (пусто - «уточняется»)', int: true, min: 0, max: 1_000_000, nullable: true }),
    lead: t.text({ label: 'Описание', max: 400 }),
    seed: t.ref('plants', { label: 'Семечко по умолчанию' }),
    published: t.bool({ label: 'Опубликован', default: true }),
    inside: t.list(
      t.obj({ name: t.str({ label: 'Цветок', max: 80 }), qty: t.str({ label: 'Сколько', max: 60 }) }),
      { label: 'Что внутри', max: 20 },
    ),
    care: t.list(t.str({ label: 'Совет', max: 300 }), { label: 'Уход именно за этим букетом', max: 10 }),
    art: t.list(
      t.obj({
        type: t.enum(FLOWER_TYPES, { label: 'Цветок' }),
        x: t.num({ label: 'x', min: 0, max: 200 }),
        y: t.num({ label: 'y', min: -24, max: 240 }),
        s: t.num({ label: 'масштаб', min: 0.2, max: 3 }),
        r: t.num({ label: 'поворот', min: -180, max: 180, optional: true }),
      }),
      { label: 'Рисунок букета', max: 24, min: 1 },
    ),
  }),

  plants: t.obj({
    slug: t.str({ label: 'Адрес', pattern: SLUG, max: 60, key: true }),
    name: t.str({ label: 'Название', max: 80 }),
    latin: t.str({ label: 'Латинское название', max: 80, optional: true }),
    lead: t.text({ label: 'Описание', max: 400 }),
    art: t.enum(PLANT_ART, { label: 'Рисунок на пакетике' }),
    sproutMin: t.num({ label: 'Всходы: от, дней', int: true, min: 1, max: 365 }),
    sproutMax: t.num({ label: 'Всходы: до, дней', int: true, min: 1, max: 365 }),
    where: t.str({ label: 'Где расти', max: 80 }),
    published: t.bool({ label: 'Опубликовано', default: true }),
    facts: t.list(
      t.obj({ label: t.str({ label: 'Параметр', max: 40 }), value: t.str({ label: 'Значение', max: 80 }) }),
      { label: 'Условия', max: 8 },
    ),
    care: t.list(t.str({ label: 'Шаг', max: 300 }), { label: 'Как вырастить', max: 12, min: 1 }),
  }),

  faq: t.obj({
    id: t.str({ label: 'ID', pattern: SLUG, max: 40, key: true }),
    q: t.str({ label: 'Вопрос', max: 200 }),
    a: t.text({ label: 'Ответ', max: 1200 }),
    published: t.bool({ label: 'Опубликован', default: true }),
  }),

  reviews: t.obj({
    id: t.str({ label: 'ID', pattern: SLUG, max: 40, key: true }),
    name: t.str({ label: 'Имя (как разрешил автор)', max: 80 }),
    text: t.text({ label: 'Отзыв', max: 1200 }),
    bouquet: t.ref('bouquets', { label: 'Букет', optional: true }),
    plant: t.ref('plants', { label: 'Семечко', optional: true }),
    published: t.bool({ label: 'Опубликован', default: true }),
  }),

  qr: t.obj({
    code: t.str({ label: 'Код в ссылке', pattern: QR_CODE, max: 32, key: true }),
    label: t.str({ label: 'Подпись (видна только в админке)', max: 120, optional: true, default: '' }),
    target: t.obj(
      {
        type: t.enum(QR_TARGET_TYPES, { label: 'Ведёт на' }),
        slug: t.str({ label: 'Какой именно (slug)', pattern: SLUG, max: 60, optional: true }),
      },
      { label: 'Цель' },
    ),
    active: t.bool({ label: 'Активен', default: true }),
  }),
}

export const COLLECTIONS = {
  pages: { key: 'slug', label: 'Разделы', title: (x) => x.menuLabel || x.title },
  bouquets: { key: 'slug', label: 'Букеты', title: (x) => x.name },
  plants: { key: 'slug', label: 'Растения', title: (x) => x.name },
  faq: { key: 'id', label: 'Вопросы', title: (x) => x.q },
  reviews: { key: 'id', label: 'Отзывы', title: (x) => `${x.name}: ${x.text.slice(0, 40)}` },
  qr: { key: 'code', label: 'QR-коды', title: (x) => `${x.code} - ${x.label}` },
}

export const isCollection = (name) => Object.hasOwn(COLLECTIONS, name)

// ---------- валидатор ----------

// Убираем управляющие символы (кроме переносов в многострочных полях)
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function check(spec, value, path, errors) {
  const label = spec.label || path || 'значение'
  const fail = (msg) => {
    errors.push({ path, message: `${label}: ${msg}` })
    return undefined
  }

  if (value === undefined || value === null || value === '') {
    if (spec.kind === 'num' && spec.nullable) return null
    if (spec.kind === 'bool') return spec.default ?? false
    if (spec.kind === 'list') return spec.min ? fail(`нужно хотя бы ${spec.min}`) : []
    if (spec.optional) return spec.default
    return fail('обязательное поле')
  }

  switch (spec.kind) {
    case 'str': {
      if (typeof value !== 'string') return fail('ожидается строка')
      let s = value.replace(/\r\n?/g, '\n').replace(CONTROL, '')
      s = spec.multiline ? s.replace(/[ \t]+$/gm, '').trim() : s.replace(/\s+/g, ' ').trim()
      if (!s) return spec.optional ? spec.default : fail('обязательное поле')
      if (s.length > spec.max) return fail(`не длиннее ${spec.max} символов`)
      if (spec.pattern && !spec.pattern.test(s)) return fail('недопустимый формат')
      if (spec.notIn?.includes(s)) return fail('этот адрес занят')
      return s
    }
    case 'num': {
      const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value
      if (typeof n !== 'number' || !Number.isFinite(n)) return fail('ожидается число')
      if (spec.int && !Number.isInteger(n)) return fail('ожидается целое число')
      if (spec.min !== undefined && n < spec.min) return fail(`не меньше ${spec.min}`)
      if (spec.max !== undefined && n > spec.max) return fail(`не больше ${spec.max}`)
      return n
    }
    case 'bool':
      if (typeof value !== 'boolean') return fail('ожидается да/нет')
      return value
    case 'enum':
      if (!spec.values.some((v) => v.value === value)) return fail('недопустимое значение')
      return value
    case 'ref':
      if (typeof value !== 'string' || !SLUG.test(value)) return fail('недопустимая ссылка')
      return value
    case 'list': {
      if (!Array.isArray(value)) return fail('ожидается список')
      if (value.length > spec.max) return fail(`не больше ${spec.max} элементов`)
      if (spec.min && value.length < spec.min) return fail(`нужно хотя бы ${spec.min}`)
      return value.map((item, i) => check(spec.of, item, `${path}[${i}]`, errors))
    }
    case 'obj': {
      if (!isPlainObject(value)) return fail('ожидается объект')
      const out = {}
      for (const [key, field] of Object.entries(spec.fields)) {
        const v = check(field, value[key], path ? `${path}.${key}` : key, errors)
        if (v !== undefined) out[key] = v
      }
      return out
    }
    case 'union': {
      if (!isPlainObject(value)) return fail('ожидается объект')
      const variant = Object.hasOwn(spec.variants, value.type) ? spec.variants[value.type] : null
      if (!variant) return fail('неизвестный тип блока')
      const inner = check({ kind: 'obj', fields: variant.fields }, value, path, errors)
      return inner && { type: value.type, ...inner }
    }
    default:
      return fail('неизвестный тип поля')
  }
}

export function validate(spec, value) {
  const errors = []
  const out = check(spec, value, '', errors)
  return { ok: errors.length === 0, value: errors.length ? undefined : out, errors }
}

export function validateItem(collection, item) {
  if (!isCollection(collection)) return { ok: false, errors: [{ path: '', message: 'Неизвестный раздел данных' }] }
  const result = validate(specs[collection], item)
  if (result.ok && collection === 'plants' && result.value.sproutMax < result.value.sproutMin) {
    return { ok: false, errors: [{ path: 'sproutMax', message: 'Всходы: «до» меньше, чем «от»' }] }
  }
  return result
}

// Проверка ссылок между коллекциями: букет -> семечко, отзыв -> букет, QR -> цель
export function crossCheck(content) {
  const errors = []
  const has = (col, slug) => content[col]?.some((x) => x[COLLECTIONS[col].key] === slug)

  for (const [name, { key }] of Object.entries(COLLECTIONS)) {
    const seen = new Set()
    for (const item of content[name] ?? []) {
      if (seen.has(item[key])) errors.push({ path: `${name}.${item[key]}`, message: `Повторяется адрес «${item[key]}»` })
      seen.add(item[key])
    }
  }
  for (const b of content.bouquets ?? []) {
    if (!has('plants', b.seed)) errors.push({ path: `bouquets.${b.slug}.seed`, message: `Букет «${b.name}»: нет семечка «${b.seed}»` })
  }
  for (const r of content.reviews ?? []) {
    if (r.bouquet && !has('bouquets', r.bouquet)) errors.push({ path: `reviews.${r.id}.bouquet`, message: `Отзыв ${r.id}: нет букета «${r.bouquet}»` })
    if (r.plant && !has('plants', r.plant)) errors.push({ path: `reviews.${r.id}.plant`, message: `Отзыв ${r.id}: нет семечка «${r.plant}»` })
  }
  const targetCollection = { plant: 'plants', bouquet: 'bouquets', page: 'pages' }
  for (const q of content.qr ?? []) {
    const col = targetCollection[q.target.type]
    if (col && !has(col, q.target.slug)) errors.push({ path: `qr.${q.code}.target`, message: `QR ${q.code}: цель «${q.target.slug ?? ''}» не найдена` })
  }
  return errors
}

export function validateContent(content) {
  if (!isPlainObject(content)) return { ok: false, errors: [{ path: '', message: 'Контент должен быть объектом' }] }
  const errors = []
  const out = {}
  const site = validate(specs.site, content.site)
  errors.push(...site.errors.map((e) => ({ ...e, path: `site.${e.path}` })))
  out.site = site.value
  for (const name of Object.keys(COLLECTIONS)) {
    const list = Array.isArray(content[name]) ? content[name] : []
    out[name] = []
    list.forEach((item, i) => {
      const r = validateItem(name, item)
      if (r.ok) out[name].push(r.value)
      else errors.push(...r.errors.map((e) => ({ ...e, path: `${name}[${i}].${e.path}` })))
    })
  }
  if (!errors.length) errors.push(...crossCheck(out))
  return { ok: errors.length === 0, value: errors.length ? undefined : out, errors }
}

// Для публичной выдачи: только опубликованное и только то, что не ссылается на скрытое
export function publicView(content) {
  const visible = (x) => x.published !== false
  const plants = content.plants.filter(visible)
  const plantSlugs = new Set(plants.map((p) => p.slug))
  const bouquets = content.bouquets.filter(visible).filter((b) => plantSlugs.has(b.seed))
  const bouquetSlugs = new Set(bouquets.map((b) => b.slug))
  const pages = content.pages.filter(visible)
  const pageSlugs = new Set(pages.map((p) => p.slug))
  return {
    site: content.site,
    pages,
    bouquets,
    plants,
    faq: content.faq.filter(visible),
    reviews: content.reviews
      .filter(visible)
      .map((r) => ({
        ...r,
        bouquet: r.bouquet && bouquetSlugs.has(r.bouquet) ? r.bouquet : undefined,
        plant: r.plant && plantSlugs.has(r.plant) ? r.plant : undefined,
      })),
    // QR на скрытую запись не отдаём: иначе человек со стаканчиком попадёт на «не найдено»
    qr: content.qr
      .filter((q) => q.active !== false)
      .filter((q) => {
        const pool = { plant: plantSlugs, bouquet: bouquetSlugs, page: pageSlugs }[q.target.type]
        return !pool || pool.has(q.target.slug)
      })
      .map(({ code, target }) => ({ code, target, active: true })),
  }
}
