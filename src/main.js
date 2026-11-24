import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/marck-script/400.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/art.css'
import './styles/detail.css'
import { createFlowerApp } from './app.js'
import { installNav } from './composables/useNav.js'
import { loadContent } from './content/store.js'

// Снимок контента из HTML читается сразу, свежие данные из API подтянутся следом
loadContent()

const { app, router } = createFlowerApp()
installNav(router)
router.isReady().then(() => app.mount('#app'))
