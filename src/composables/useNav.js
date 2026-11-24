// Навигация «как в приложении»: направление анимации, кнопка «назад», меню-шторка
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const nav = reactive({ direction: 'none' }) // none | forward | back
export const menuOpen = ref(false)

// vue-router хранит в history.state позицию и предыдущий адрес.
// Позиция меньше прежней - человек нажал «назад» (кнопкой браузера или жестом).
export function directionOf(prevPos, nextPos, firstLoad) {
  if (firstLoad) return 'none'
  return nextPos < prevPos ? 'back' : 'forward'
}

export function installNav(router) {
  if (typeof window === 'undefined') return
  let lastPos = window.history.state?.position ?? 0
  router.afterEach((to, from, failure) => {
    if (failure) return
    const pos = window.history.state?.position ?? 0
    nav.direction = directionOf(lastPos, pos, !from.matched.length)
    lastPos = pos
    menuOpen.value = false
  })
}

export function useBack() {
  const router = useRouter()
  const route = useRoute()
  return () => {
    // Внутри сайта есть куда вернуться - идём по истории, иначе к родительскому разделу
    if (typeof window !== 'undefined' && window.history.state?.back) router.back()
    else router.push({ name: route.meta.parent || 'home' })
  }
}
