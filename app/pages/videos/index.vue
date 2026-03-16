<template>
    <div class="p-6 max-w-4xl mx-auto">
    <div v-if="store.error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">⚠️</span>
      <span>{{ store.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
    </div>

    <div v-if="!store.me?.linkedChannels?.length" class="rounded-card p-6 bg-card-bg border border-border-default">
      <p class="text-text-muted">No YouTube channels linked. Sign in with a Google account that has a YouTube channel.
      </p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 class="text-2xl font-bold text-text-primary">All Videos</h1>
        <div class="flex items-center gap-3">
          <div class="flex flex-wrap gap-2">
            <span v-for="ch in store.me?.linkedChannels" :key="ch.id"
              class="inline-flex px-3 py-1.5 rounded-button text-sm bg-filter-bg border border-filter-border text-filter-text-active">
              @{{ ch.handle }}
            </span>
          </div>
          <button type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="store.isLoading || !store.me?.linkedChannels?.length" @click="store.runAudit">
            {{ store.isLoading ? 'Auditing...' : 'Run Audit' }}
          </button>
          <NuxtLink to="/dashboard"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention">
            Dashboard
          </NuxtLink>
        </div>
      </div>

      <div v-if="store.isLoading" class="mb-6">
        <p class="text-text-muted mb-2 font-medium">Running audit...</p>
        <p class="text-text-muted text-sm mb-4">
          This can take several minutes for channels with many videos.
        </p>
        <ul class="text-sm text-text-muted/80 space-y-1 mb-4 list-disc list-inside">
          <li>Fetching videos from YouTube</li>
          <li>Checking links</li>
          <li>Fetching comments</li>
        </ul>
        <div class="h-1 rounded-full bg-border-default overflow-hidden mb-4">
          <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/3" />
        </div>
        <AuditSkeleton />
      </div>

      <div v-else-if="store.videos.length > 0">
        <ErrorBoundary>
          <VideoList
            :videos="store.videos"
            :sync-link-results-to-store="true"
            :highlight-video-id="route.query.videoId as string | undefined"
            :video-scores="videoScores"
          />
        </ErrorBoundary>
      </div>

      <div v-else class="rounded-card p-8 bg-card-bg border border-border-default text-center">
        <p class="text-text-muted mb-4">Run an audit to see your videos and check links.</p>
        <button type="button"
          class="px-6 py-3 rounded-button font-semibold bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60"
          :disabled="store.isLoading" @click="store.runAudit">
          Run Audit
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})
useSeoMeta({ title: 'All Videos | YT-Audit' })

const route = useRoute()
const store = useCreatorWorkspaceStore()

const videoScores = ref<Record<string, number>>({})

const fetchChannelScore = async () => {
  if (!store.me?.linkedChannels?.length) return
  try {
    const res = await $fetch<{ last10VideoScores?: Array<{ videoId: string; score: number }> }>('/api/channel-score')
    const list = res.last10VideoScores ?? []
    videoScores.value = Object.fromEntries(list.map((x) => [x.videoId, x.score]))
  } catch {
    // ignore
  }
}

watch(() => store.videos.length, (len) => {
  if (len > 0) fetchChannelScore()
}, { immediate: true })
</script>
