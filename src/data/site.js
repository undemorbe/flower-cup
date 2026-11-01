// TODO: телефон, почта и доставка - заглушки, заменить на реальные перед запуском.
export const site = {
  name: 'Flower Cup',
  tagline: 'Букет, который продолжает жить',
  telegram: 'polyvinylchlorid', // username без @
  phone: '+7 900 000-00-00',
  email: 'hello@flowercup.ru',
  city: 'Самовывоз и доставка по городу',
}

export const telegramLink = (text) =>
  `https://t.me/${site.telegram}${text ? `?text=${encodeURIComponent(text)}` : ''}`
