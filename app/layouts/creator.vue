<template>
  <div class="h-screen font-sans bg-page-bg text-text-primary flex flex-col md:flex-row overflow-hidden">
    <aside
      class="w-full md:flex-shrink-0 border-r border-border-default bg-card-bg flex flex-col overflow-y-auto transition-[width] duration-200 ease-in-out"
      :class="sidebarCollapsed ? 'md:w-16' : 'md:w-60'">
      <div class="p-4 border-b border-border-default flex items-center justify-between gap-2">
        <NuxtLink to="/dashboard" class="flex items-center gap-2 min-w-0 flex-1">
          <span
            class="text-lg font-bold bg-gradient-to-r from-title-from via-title-via to-title-to bg-clip-text text-transparent truncate"
            :class="{ 'sr-only': sidebarCollapsed }">
            YT-Audit
          </span>
        </NuxtLink>
        <button type="button"
          class="flex-shrink-0 p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-card-bg-attention transition-colors"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="sidebarCollapsed = !sidebarCollapsed">
          <svg v-if="sidebarCollapsed" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div v-if="store.me?.linkedChannels?.length && !sidebarCollapsed" class="px-4 py-4 flex items-center gap-2">
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

      <nav class="flex-1 p-3 space-y-1" :class="sidebarCollapsed ? 'flex flex-col items-center' : ''">
        <NuxtLink to="/dashboard" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/dashboard' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'
        ]" title="Dashboard">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span v-if="!sidebarCollapsed">Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/videos" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/videos' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'
        ]" title="All Videos">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span v-if="!sidebarCollapsed">All Videos</span>
        </NuxtLink>
        <NuxtLink to="/comments" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/comments' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'
        ]" title="Comments">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span v-if="!sidebarCollapsed">Comments</span>
        </NuxtLink>
        <NuxtLink to="/settings" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/settings' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-card-bg-attention'
        ]" title="Settings">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span v-if="!sidebarCollapsed">Settings</span>
        </NuxtLink>
      </nav>

      <div v-if="store.deadLinksCount > 0 && !sidebarCollapsed"
        class="mx-3 mb-3 p-3 rounded-card bg-error-bg border border-error-border">
        <p class="text-xs font-semibold text-error-text">CRITICAL</p>
        <p class="text-sm font-bold text-error-text">{{ store.deadLinksCount }} dead link{{ store.deadLinksCount > 1 ?
          's' : '' }}</p>
      </div>

      <div class="p-3 border-t border-border-default space-y-2"
        :class="sidebarCollapsed ? 'flex flex-col items-center' : ''">
        <button type="button"
          class="rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention flex items-center justify-center transition-colors"
          :class="sidebarCollapsed ? 'p-2.5 w-10' : 'w-full px-3 py-2 gap-2'"
          :title="theme === 'dark' ? 'Light mode' : 'Dark mode'" @click="toggleTheme">
          <span>{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
          <span v-if="!sidebarCollapsed">{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
        </button>
        <div class="flex items-center gap-2 mb-2" :class="sidebarCollapsed ? 'justify-center' : ''">
          <img v-if="store.me?.user?.avatarUrl" :src="store.me.user.avatarUrl" :alt="store.me.user.name ?? ''"
            class="w-8 h-8 rounded-full flex-shrink-0" />
          <div v-else class="w-8 h-8 rounded-full bg-thumb-bg flex items-center justify-center flex-shrink-0">
            <span class="text-xs text-text-muted">?</span>
          </div>
          <div v-if="!sidebarCollapsed" class="min-w-0 flex-1">
            <p class="text-sm font-medium text-text-primary truncate">{{ store.me?.user?.name ?? store.me?.user?.email
              ?? 'User' }}</p>
          </div>
        </div>
        <button type="button"
          class="rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention transition-colors"
          :class="sidebarCollapsed ? 'p-2.5 w-10' : 'w-full px-3 py-2'" title="Logout" @click="logout">
          <svg v-if="sidebarCollapsed" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span v-else>Logout</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'
import { useTheme } from '~~/composables/useTheme'

const SIDEBAR_COLLAPSED_KEY = 'yt-audit-sidebar-collapsed'

const store = useCreatorWorkspaceStore()
const { theme, initTheme, toggleTheme } = useTheme()

const sidebarCollapsed = ref(false)

function loadSidebarCollapsed() {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      sidebarCollapsed.value = stored === 'true'
    } catch {
      // ignore
    }
  }
}

watch(sidebarCollapsed, (v) => {
  if (import.meta.client) {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(v))
    } catch {
      // ignore
    }
  }
})

onMounted(async () => {
  loadSidebarCollapsed()
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
