<template>
  <div class="h-screen font-sans bg-page-bg text-text-primary flex flex-col md:flex-row overflow-hidden">
    <aside
      class="w-full md:flex-shrink-0 border-r border-border-default bg-card-bg flex flex-col overflow-y-auto transition-[width] duration-200 ease-in-out"
      :class="sidebarCollapsed ? 'md:w-16' : 'md:w-60'">
      <div class="p-4 border-b border-border-default flex items-center justify-between gap-2">
        <NuxtLink to="/admin/dashboard" class="flex items-center gap-2 min-w-0 flex-1">
          <span
            class="text-lg font-bold bg-gradient-to-r from-title-from via-title-via to-title-to bg-clip-text text-transparent truncate"
            :class="{ 'sr-only': sidebarCollapsed }">
            UpScrub Admin
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

      <nav class="flex-1 p-3 space-y-1" :class="sidebarCollapsed ? 'flex flex-col items-center' : ''">
        <NuxtLink to="/admin/dashboard" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/admin/dashboard' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg-attention'
        ]" title="Dashboard">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span v-if="!sidebarCollapsed">Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/admin/audit" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/admin/audit' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg-attention'
        ]" title="Run Audit">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span v-if="!sidebarCollapsed">Run Audit</span>
        </NuxtLink>
        <NuxtLink to="/admin/history" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/admin/history' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg-attention'
        ]" title="History">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span v-if="!sidebarCollapsed">History</span>
        </NuxtLink>
        <NuxtLink to="/admin/comments" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/admin/comments' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg-attention'
        ]" title="Comments">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span v-if="!sidebarCollapsed">Comments</span>
        </NuxtLink>
        <NuxtLink to="/admin/comments-export" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path === '/admin/comments-export' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg-attention'
        ]" title="Export">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span v-if="!sidebarCollapsed">Export</span>
        </NuxtLink>
        <NuxtLink to="/admin/channel-score" class="flex items-center rounded-button text-sm font-medium transition-colors" :class="[
          sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'gap-3 px-3 py-2.5',
          $route.path.startsWith('/admin/channel-score') ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg-attention'
        ]" title="Channel Score">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v3a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v6" />
          </svg>
          <span v-if="!sidebarCollapsed">Channel Score</span>
        </NuxtLink>
      </nav>

      <div class="p-3 border-t border-border-default space-y-2"
        :class="sidebarCollapsed ? 'flex flex-col items-center' : ''">
        <NuxtLink
          to="/"
          class="rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention flex items-center transition-colors"
          :class="sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'w-full px-3 py-2 gap-2'"
          title="Back to app">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span v-if="!sidebarCollapsed">Back to app</span>
        </NuxtLink>
        <button
          type="button"
          class="rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention flex items-center transition-colors w-full"
          :class="sidebarCollapsed ? 'justify-center p-2.5 w-10' : 'px-3 py-2 gap-2'"
          title="Logout"
          @click="logout">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const SIDEBAR_COLLAPSED_KEY = 'upscrub-admin-sidebar-collapsed'

const sidebarCollapsed = ref(false)

const loadSidebarCollapsed = () => {
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

onMounted(() => loadSidebarCollapsed())

const logout = async () => {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>
