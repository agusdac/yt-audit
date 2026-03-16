<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div v-if="store.error && !store.hasVideos"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">&#9888;</span>
      <span>{{ store.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
    </div>

    <div v-if="!store.me?.linkedChannels?.length" class="rounded-card p-6 bg-card-bg border border-border-default">
      <p class="text-text-muted">No YouTube channels linked. Sign in with a Google account that has a YouTube channel.</p>
    </div>

    <template v-else>
      <div v-if="store.isLoading || store.isCheckingLinks" class="mb-6">
        <p class="text-text-muted mb-2 font-medium">
          {{ store.isCheckingLinks ? 'Checking links...' : 'Running audit...' }}
        </p>
        <p class="text-text-muted text-sm mb-4">
          This can take several minutes for channels with many videos.
        </p>
        <ul class="text-sm text-text-muted/80 space-y-1 mb-4 list-disc list-inside">
          <li>{{ store.isCheckingLinks ? 'Verifying link status' : 'Fetching videos from YouTube' }}</li>
          <li>{{ store.isCheckingLinks ? 'Updating results' : 'Checking links' }}</li>
          <li>{{ store.isCheckingLinks ? 'Done soon' : 'Fetching comments' }}</li>
        </ul>
        <div class="h-1 rounded-full bg-border-default overflow-hidden mb-4">
          <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/3" />
        </div>
        <AuditSkeleton />
      </div>
      <div v-else-if="!store.hasVideos" class="rounded-card p-8 bg-card-bg border border-border-default text-center">
        <h2 class="text-xl font-bold text-text-primary mb-2">Run your first audit</h2>
        <p class="text-text-muted mb-6 max-w-md mx-auto">
          Scan your video descriptions for dead links, expired codes, and revenue impact. We'll show you exactly what to
          fix.
        </p>
        <div class="flex flex-wrap gap-2 justify-center mb-6">
          <span v-for="ch in store.me?.linkedChannels" :key="ch.id"
            class="inline-flex px-3 py-1.5 rounded-button text-sm bg-filter-bg border border-filter-border text-filter-text-active">
            @{{ ch.handle }}
          </span>
        </div>
        <button type="button"
          class="px-6 py-3 rounded-button font-semibold bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60 disabled:cursor-not-allowed"
          @click="store.runAudit">
          Run Audit
        </button>
      </div>

      <template v-else>
        <DashboardContent
          :videos="store.videos"
          :link-results="store.linkResults"
          :high-intent-comments="store.highIntentComments"
          :total-revenue-loss="totalRevenueLoss"
          :dead-links-with-revenue="deadLinksWithRevenue"
          :top-videos-by-revenue-loss="topVideosByRevenueLoss"
          :dead-links-count="store.deadLinksCount"
          :videos-affected-by-dead-links="videosAffectedByDeadLinks"
          :videos-affected-by-comments="videosAffectedByComments"
          :is-loading="store.isLoading"
          :is-checking-links="store.isCheckingLinks"
          :is-fetching-comments="store.isFetchingComments"
          :comments-status="commentsStatus"
          :has-videos="store.hasVideos"
          :last-audit-at="store.lastAuditAt"
          :is-cache-stale="isCacheStale"
          :error="store.error"
          view-videos-href="/videos"
          view-comments-href="/comments"
          :on-run-audit="store.runAudit"
          :on-fetch-comments="store.fetchComments"
          :on-clear-error="store.clearError"
          :scheduled-audit-enabled="store.creatorSettings?.scheduledAuditEnabled"
          :scheduled-audit-frequency="store.creatorSettings?.scheduledAuditFrequency"
          :channel-handle-for-score="store.me?.linkedChannels?.[0]?.handle"
          channel-score-detail-href="/channel-score"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { getRevenueLossForLink, estimateMonthlyViews } from '~~/utils/revenue'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})
useSeoMeta({ title: 'Dashboard | YT-Audit' })

const store = useCreatorWorkspaceStore()

onMounted(() => {
  if (store.hasVideos) store.loadCommentsFromCache()
  store.loadCreatorSettings()
})

watch(() => store.hasVideos, (hasVideos) => {
  if (hasVideos && !store.hasCommentsLoaded && !store.isFetchingComments) {
    store.loadCommentsFromCache()
  }
}, { immediate: true })

const deadLinksWithRevenue = computed(() => {
  const dead = store.linkResults.filter((r) => r.category === 'dead')
  const videoMap = new Map(store.videos.map((v) => [v.id, v]))
  return dead.map((r) => {
    const { revenueLoss } = getRevenueLossForLink(r, store.videos, { userSponsors: store.creatorSettings?.sponsorDomains ?? [], creatorSettings: store.creatorSettings ?? undefined })
    const firstVideoId = (r.videoIds ?? [])[0]
    const firstVideo = firstVideoId ? videoMap.get(firstVideoId) : undefined
    return {
      url: r.url,
      videoIds: r.videoIds ?? [],
      revenueLoss,
      firstVideoId,
      firstVideoTitle: firstVideo?.title
    }
  })
})

const videosAffectedByDeadLinks = computed(() => {
  const dead = store.linkResults.filter((r) => r.category === 'dead')
  const ids = new Set<string>()
  for (const r of dead) {
    for (const id of r.videoIds ?? []) ids.add(id)
  }
  return ids.size
})

const videosAffectedByComments = computed(() => {
  const ids = new Set(store.highIntentComments.map((c) => c.videoId))
  return ids.size
})

const totalRevenueLoss = computed(() =>
  deadLinksWithRevenue.value.reduce((sum, i) => sum + i.revenueLoss, 0)
)

const topVideosByRevenueLoss = computed(() => {
  const videoToLoss = new Map<string, number>()
  for (const item of deadLinksWithRevenue.value) {
    const videos = item.videoIds
      .map((id) => store.videos.find((v) => v.id === id))
      .filter((v): v is NonNullable<typeof v> => !!v)
    const totalViews = videos.reduce((s, v) => s + estimateMonthlyViews(v.viewCount, v.publishedAt), 0)
    if (totalViews <= 0) continue
    for (const v of videos) {
      const share = estimateMonthlyViews(v.viewCount, v.publishedAt) / totalViews
      videoToLoss.set(v.id, (videoToLoss.get(v.id) ?? 0) + item.revenueLoss * share)
    }
  }
  return [...videoToLoss.entries()]
    .map(([videoId, revenueLoss]) => {
      const v = store.videos.find((x) => x.id === videoId)
      return { videoId, title: v?.title ?? 'Unknown', revenueLoss }
    })
    .sort((a, b) => b.revenueLoss - a.revenueLoss)
    .slice(0, 10)
})

const commentsStatus = computed(() => {
  if (store.isFetchingComments) return 'loading'
  if (store.highIntentComments.length > 0) return 'hasComments'
  if (store.hasCommentsLoaded) return 'none'
  return 'idle'
})

const config = useRuntimeConfig()
const auditCacheTtlHours = config.public?.auditCacheTtlHours ?? 24
const isCacheStale = computed(() => {
  if (!store.lastAuditAt) return false
  const ageHours = (Date.now() - store.lastAuditAt.getTime()) / (1000 * 60 * 60)
  return ageHours >= auditCacheTtlHours
})
</script>
