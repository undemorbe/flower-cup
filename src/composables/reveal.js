// v-reveal: один мягкий вход блока при первом появлении в окне
const io =
  typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        },
        { rootMargin: '0px 0px -12% 0px' },
      )
    : null

export const reveal = {
  mounted(el, { value }) {
    if (!io) return
    el.classList.add('reveal')
    if (value) el.style.transitionDelay = `${value}ms`
    io.observe(el)
  },
  unmounted(el) {
    io?.unobserve(el)
  },
}
