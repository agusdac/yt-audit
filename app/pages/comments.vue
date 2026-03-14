<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="store.error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">⚠️</span>
      <span>{{ store.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
    </div>

    <div v-if="!store.me?.linkedChannels?.length" class="rounded-card p-6 bg-card-bg border border-border-default">
      <p class="text-text-muted">No YouTube channels linked. Sign in with a Google account that has a YouTube channel.</p>
    </div>

    <template v-else>
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
        <p class="text-text-muted">Scanning comments across your videos...</p>
        <div class="mt-3 h-1.5 rounded-full bg-border-default overflow-hidden">
          <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/2" />
        </div>
      </div>

      <div v-else-if="store.highIntentComments.length > 0" class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm font-medium text-text-muted">Show:</span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="showFilter === 'unanswered' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-border-default text-text-muted hover:bg-filter-bg'"
            @click="showFilter = 'unanswered'"
          >
            Unanswered ({{ unansweredCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="showFilter === 'all' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-border-default text-text-muted hover:bg-filter-bg'"
            @click="showFilter = 'all'"
          >
            All ({{ store.highIntentComments.length }})
          </button>
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
            :class="{ 'border-merch-border text-merch-link': exportSuccess }"
            @click="exportToCsv"
          >
            {{ exportSuccess ? 'Exported!' : 'Export to CSV' }}
          </button>
        </div>
        <div
          v-for="c in displayedComments"
          :key="c.id"
          class="rounded-card p-4 bg-card-bg border border-border-default flex flex-col sm:flex-row sm:items-center gap-3"
          :class="{ 'opacity-60': isAnswered(c.id) }"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm text-text-primary">{{ c.text }}</p>
            <p class="text-xs text-text-muted mt-1">
              {{ c.authorDisplayName }} · {{ c.videoTitle }}
            </p>
          </div>
          <div class="flex flex-shrink-0 gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium transition-colors"
              :class="isAnswered(c.id) ? 'bg-merch-bg border border-merch-border text-merch-link' : 'bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention'"
              @click="store.markCommentAsAnswered(c.id, !isAnswered(c.id))"
            >
              {{ isAnswered(c.id) ? 'Answered' : 'Mark as answered' }}
            </button>
            <a
              :href="c.permalink"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
            >
              Reply on YouTube
            </a>
          </div>
        </div>
      </div>

      <div v-else-if="store.hasVideos" class="rounded-card p-8 bg-card-bg border border-border-default text-center">
        <p class="text-text-muted mb-4">Click "Fetch comments" to scan your videos for purchase-intent comments.</p>
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
        <p class="text-text-muted">Run an audit first to load your videos, then fetch comments.</p>
        <NuxtLink
          to="/dashboard"
          class="inline-block mt-4 px-6 py-3 rounded-button font-semibold bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
        >
          Go to Dashboard
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})

const store = useCreatorWorkspaceStore()
const showFilter = ref<'unanswered' | 'all'>('unanswered')

const isAnswered = (commentId: string) => store.answeredCommentIds.includes(commentId)

const unansweredCount = computed(() =>
  store.highIntentComments.filter((c) => !store.answeredCommentIds.includes(c.id)).length
)

const displayedComments = computed(() => {
  if (showFilter.value === 'all') return store.highIntentComments
  return store.highIntentComments.filter((c) => !store.answeredCommentIds.includes(c.id))
})

function escapeCsvValue(text: string): string {
  const escaped = text.replace(/"/g, '""')
  return `"${escaped}"`
}

const exportSuccess = ref(false)
const exportToCsv = () => {
  if (store.highIntentComments.length === 0) return
  const header = 'text'
  const rows = store.highIntentComments.map((c) => escapeCsvValue(c.text))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `high-intent-comments-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  exportSuccess.value = true
  setTimeout(() => { exportSuccess.value = false }, 2500)
}

onMounted(() => {
  store.loadCommentsFromCache()
})
</script>
