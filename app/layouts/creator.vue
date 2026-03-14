<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary flex flex-col md:flex-row">
    <aside class="w-full md:w-60 flex-shrink-0 border-r border-border-default bg-card-bg flex flex-col">
      <div class="p-4 border-b border-border-default">
        <NuxtLink to="/dashboard" class="flex items-center gap-2">
          <span
            class="text-lg font-bold bg-gradient-to-r from-title-from via-title-via to-title-to bg-clip-text text-transparent">
            YT-Audit
          </span>
        </NuxtLink>
        <div v-if="store.me?.linkedChannels?.length" class="mt-4 flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-thumb-bg flex items-center justify-center overflow-hidden">
            <img v-if="store.me?.user?.avatarUrl" :src="store.me.user.avatarUrl" :alt="store.me.user.name ?? ''"
              class="w-full h-full object-cover" />
            <span v-else class="text-xs text-text-muted">@</span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-text-primary truncate">@{{ store.firstChannel?.handle ?? 'Channel' }}</p>
            <p class="text-xs text-text-muted">{{ store.me?.linkedChannels?.length }} channel{{
              (store.me?.linkedChannels?.length ?? 0) > 1 ? 's' : '' }}</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink to="/dashboard"
          class="flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors"
          :class="$route.path === '/dashboard' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Dashboard
        </NuxtLink>
        <NuxtLink to="/videos"
          class="flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors"
          :class="$route.path === '/videos' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          All Videos
        </NuxtLink>
        <NuxtLink to="/comments"
          class="flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors"
          :class="$route.path === '/comments' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments
        </NuxtLink>
        <NuxtLink to="/settings"
          class="flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors"
          :class="$route.path === '/settings' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </NuxtLink>
      </nav>

      <div v-if="store.deadLinksCount > 0" class="mx-3 mb-3 p-3 rounded-card bg-error-bg border border-error-border">
        <p class="text-xs font-semibold text-error-text">CRITICAL</p>
        <p class="text-sm font-bold text-error-text">{{ store.deadLinksCount }} dead link{{ store.deadLinksCount > 1 ?
          's' : '' }}</p>
      </div>

      <div class="p-3 border-t border-border-default space-y-2">
        <button
          type="button"
          class="w-full px-3 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention flex items-center justify-center gap-2"
          @click="toggleTheme"
        >
          <span>{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
          <span>{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
        </button>
        <div class="flex items-center gap-2 mb-2">
          <img v-if="store.me?.user?.avatarUrl" :src="store.me.user.avatarUrl" :alt="store.me.user.name ?? ''"
            class="w-8 h-8 rounded-full" />
          <div v-else class="w-8 h-8 rounded-full bg-thumb-bg flex items-center justify-center">
            <span class="text-xs text-text-muted">?</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-text-primary truncate">{{ store.me?.user?.name ?? store.me?.user?.email
              ?? 'User' }}</p>
          </div>
        </div>
        <button type="button"
          class="w-full px-3 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention transition-colors"
          @click="logout">
          Logout
        </button>
      </div>
    </aside>

    <main class="flex-1 min-w-0 overflow-x-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'
import { useTheme } from '~~/composables/useTheme'

const store = useCreatorWorkspaceStore()
const { theme, initTheme, toggleTheme } = useTheme()

onMounted(async () => {
  initTheme()
  if (!store.me) await store.fetchMe()
  await store.loadCreatorSettings()
  const config = useRuntimeConfig()
  if (config.public.autoRunAuditOnLogin && store.me?.linkedChannels?.length && !store.hasVideos) {
    const cached = await store.loadFromCache()
    if (!cached) {
      await store.runAudit()
    }
    if (store.hasVideos) await store.loadCommentsFromCache()
  }
})

const logout = async () => {
  const { clear } = useUserSession()
  await clear()
  await navigateTo('/')
}
</script>
