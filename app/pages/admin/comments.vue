<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="store.error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">&#9888;</span>
      <span>{{ store.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
    </div>

    <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
      <h1 class="text-2xl font-bold text-text-primary">High-Intent Comments</h1>
      <button
        type="button"
        class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="store.isFetchingComments || store.videos.length === 0"
        @click="store.fetchComments"
      >
        {{ store.isFetchingComments ? 'Fetching...' : 'Fetch comments' }}
      </button>
    </div>

    <p class="text-text-muted mb-6">
      Find comments that ask where to buy, discount codes, or show purchase intent. These viewers could become customers.
    </p>

    <div v-if="store.isFetchingComments" class="mb-6">
      <p class="text-text-muted">Scanning comments across videos...</p>
      <div class="mt-3 h-1.5 rounded-full bg-border-default overflow-hidden">
        <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/2" />
      </div>
    </div>

    <div v-else-if="store.highIntentComments.length > 0" class="space-y-4">
      <div
        v-for="c in store.highIntentComments"
        :key="c.id"
        class="rounded-card p-4 bg-card-bg border border-border-default flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm text-text-primary">{{ c.text }}</p>
          <p class="text-xs text-text-muted mt-1">
            {{ c.authorDisplayName }} · {{ c.videoTitle }}
          </p>
        </div>
        <a
          :href="c.permalink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-shrink-0 px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
        >
          Reply on YouTube
        </a>
      </div>
    </div>

    <div v-else-if="store.hasVideos" class="rounded-card p-8 bg-card-bg border border-border-default text-center">
      <p class="text-text-muted mb-4">Click "Fetch comments" to scan videos for purchase-intent comments.</p>
      <button
        type="button"
        class="px-6 py-3 rounded-button font-semibold bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60"
        :disabled="store.isFetchingComments"
        @click="store.fetchComments"
      >
        Fetch comments
      </button>
    </div>

    <div v-else class="rounded-card p-8 bg-card-bg border border-border-default text-center">
      <p class="text-text-muted">Run an audit first to load videos, then fetch comments.</p>
      <NuxtLink
        to="/admin/dashboard"
        class="inline-block mt-4 px-6 py-3 rounded-button font-semibold bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
      >
        Go to Dashboard
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdminAuditStore } from '~~/stores/adminAuditStore'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const store = useAdminAuditStore()

onMounted(() => {
  if (store.channelHandles.length > 0) store.loadCommentsFromCache()
})
</script>
