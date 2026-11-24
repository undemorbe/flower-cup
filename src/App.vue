<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import OrderBar from './components/OrderBar.vue'
import TabBar from './components/TabBar.vue'
import { nav } from './composables/useNav.js'
import { pageLeft } from './router.js'
import { head, buildHead, applyHead } from './seo/head.js'
import { state } from './content/store.js'

const route = useRoute()
const isAdmin = computed(() => route.meta.layout === 'admin')
const bare = computed(() => Boolean(route.meta.bare))

const transition = computed(() => (nav.direction === 'back' ? 'page-back' : nav.direction === 'forward' ? 'page-forward' : 'page-fade'))

// Заголовок и мета-теги вкладки
if (typeof document !== 'undefined') {
  watch(
    () => head.current && buildHead(head.current, state.content.site),
    (h) => h && applyHead(h),
    { immediate: true },
  )
}
</script>

<template>
  <RouterView v-if="isAdmin" />
  <template v-else>
    <a class="skip" href="#main">К содержимому</a>
    <SiteHeader v-if="!bare" />
    <main id="main" tabindex="-1">
      <RouterView v-slot="{ Component, route: r }">
        <Transition :name="transition" mode="out-in" @after-leave="pageLeft">
          <div :key="r.path" class="page">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>
    <SiteFooter v-if="!bare && route.name !== 'contacts'" />
    <OrderBar v-if="!bare" />
    <TabBar v-if="!bare" />
  </template>
</template>
