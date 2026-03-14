<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary">
    <header class="border-b border-border-default bg-card-bg">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-6">
            <NuxtLink to="/" class="text-lg font-semibold text-text-primary hover:text-hover-link transition-colors">
              YT-Audit Admin
            </NuxtLink>
            <nav class="flex items-center gap-2">
              <NuxtLink
                to="/admin/dashboard"
                class="px-3 py-1.5 rounded-button text-sm font-medium transition-colors"
                :class="$route.path === '/admin/dashboard' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg'"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                to="/admin/audit"
                class="px-3 py-1.5 rounded-button text-sm font-medium transition-colors"
                :class="$route.path === '/admin/audit' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg'"
              >
                Run Audit
              </NuxtLink>
              <NuxtLink
                to="/admin/history"
                class="px-3 py-1.5 rounded-button text-sm font-medium transition-colors"
                :class="$route.path === '/admin/history' ? 'bg-filter-bg-active border border-filter-border-active text-filter-text-active' : 'text-text-muted hover:text-text-primary hover:bg-filter-bg'"
              >
                History
              </NuxtLink>
            </nav>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink
              to="/"
              class="px-3 py-1.5 rounded-button text-sm font-medium text-text-muted hover:text-text-primary hover:bg-card-bg-attention transition-colors"
            >
              Back to app
            </NuxtLink>
            <button
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
              @click="logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const logout = async () => {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>
