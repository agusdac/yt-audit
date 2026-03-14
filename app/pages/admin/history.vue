<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <div class="rounded-card p-6 bg-card-bg border border-border-default space-y-4">
        <h2 class="font-semibold text-text-primary">Recent audits</h2>
        <p class="text-sm text-text-muted">Audit history for admin-tracked channels. Historical tracking and trends coming soon.</p>
        <div v-if="!(history ?? []).length" class="text-text-muted text-sm py-8">No audits yet. Run an audit from the Run Audit page.</div>
        <ul v-else class="space-y-2 text-sm">
          <li v-for="item in (history ?? [])" :key="item.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 border-b border-border-default last:border-0">
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
import { formatDateTime } from '~~/utils/format'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const { data: history } = await useFetch<Array<{ id: number; handle: string; videoCount: number; createdAt: string }>>('/api/admin/history')
</script>
