<template>
  <div class="min-h-screen bg-page-bg p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Admin</h1>
        <button
          type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
          @click="logout"
        >
          Logout
        </button>
      </div>
      <div class="rounded-card p-6 bg-card-bg border border-border-default space-y-4">
        <h2 class="font-semibold text-text-primary">Recent audits</h2>
        <div v-if="!(history ?? []).length" class="text-text-muted text-sm">No audits yet.</div>
        <ul v-else class="space-y-2 text-sm">
          <li v-for="item in (history ?? [])" :key="item.id" class="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span class="text-text-primary font-medium">@{{ item.handle }}</span>
            <span class="text-text-muted">{{ item.videoCount }} videos</span>
            <span class="text-text-muted text-xs">{{ formatDateTime(item.createdAt) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth'
})

const { data: history } = await useFetch<Array<{ id: number; handle: string; videoCount: number; createdAt: string }>>('/api/admin/history')

import { formatDateTime } from '~~/utils/format'

const logout = async () => {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>
