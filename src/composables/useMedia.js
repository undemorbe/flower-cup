import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useMedia(query) {
  const matches = ref(false)
  let mql
  const update = () => (matches.value = mql.matches)
  onMounted(() => {
    mql = window.matchMedia(query)
    update()
    mql.addEventListener('change', update)
  })
  onBeforeUnmount(() => mql?.removeEventListener('change', update))
  return matches
}
