<template>
  <div class="p-6">
    <div class="max-w-5xl mx-auto">
      <div class="rounded-card p-6 bg-card-bg border border-border-default mb-6">
        <h2 class="font-semibold text-text-primary mb-4">Audit any channel</h2>
        <div class="flex flex-wrap gap-2 p-3 rounded-card bg-filter-bg border border-border-default mb-4">
          <span
            v-for="handle in store.channelHandles"
            :key="handle"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary"
          >
            @{{ handle }}
            <button type="button" class="hover:text-error-text transition-colors -mr-0.5" aria-label="Remove" @click="removeChannel(handle)">
              x
            </button>
          </span>
          <input
            ref="channelInputRef"
            v-model="channelInput"
            type="text"
            placeholder="Add channel (@handle)"
            class="flex-1 min-w-[140px] px-2 py-1.5 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-sm"
            @keydown.enter.prevent="addChannel"
            @keydown.comma.prevent="addChannel"
          />
        </div>
        <button
          type="button"
          class="px-6 py-3 rounded-button font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to"
          :disabled="store.isLoading || store.isCheckingLinks || store.channelHandles.length === 0"
          @click="runAudit"
        >
          {{ store.isLoading ? 'Running audit...' : store.isCheckingLinks ? 'Checking links...' : 'Run Audit' }}
        </button>
      </div>

      <div v-if="store.error && !store.hasVideos"
        class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
        <span class="text-2xl">&#9888;</span>
        <span>{{ store.error }}</span>
        <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
      </div>

      <div v-if="store.isLoading || store.isCheckingLinks" class="mb-6">
        <p class="text-text-muted mb-2 font-medium">
          {{ store.isCheckingLinks ? 'Checking links...' : 'Running audit...' }}
        </p>
        <p class="text-text-muted text-sm mb-4">
          This can take several minutes for channels with many videos.
        </p>
        <ul class="text-sm text-text-muted/80 space-y-1 mb-4 list-disc list-inside">
          <li>Fetching videos from YouTube</li>
          <li>Checking links</li>
          <li>Fetching comments</li>
        </ul>
        <div class="h-1 rounded-full bg-border-default overflow-hidden mb-4">
          <div
            class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/3"
          />
        </div>
        <AuditSkeleton />
      </div>

      <template v-else-if="store.hasVideos">
        <DashboardContent
          :videos="store.videos"
          :link-results="store.linkResults"
          :high-intent-comments="store.highIntentComments"
          :total-revenue-loss="totalRevenueLoss"
          :dead-links-with-revenue="deadLinksWithRevenue"
          :dead-links-count="store.deadLinksCount"
          :videos-affected-by-dead-links="videosAffectedByDeadLinks"
          :videos-affected-by-comments="videosAffectedByComments"
          :is-loading="store.isLoading"
          :is-checking-links="store.isCheckingLinks"
          :is-fetching-comments="store.isFetchingComments"
          :comments-status="commentsStatus"
          :has-videos="store.hasVideos"
          :last-audit-at="store.lastAuditAt"
          :error="store.error"
          view-videos-href="/admin/audit"
          view-comments-href="/admin/comments"
          :on-run-audit="runAudit"
          :on-fetch-comments="store.fetchComments"
          :on-clear-error="store.clearError"
        >
          <template #check-links-cta>
            <button
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-btn-from text-white hover:opacity-90"
              @click="store.runLinkCheck"
            >
              Check links
            </button>
          </template>
        </DashboardContent>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getRevenueLossForLink } from '~~/utils/revenue'
import { useAdminAuditStore } from '~~/stores/adminAuditStore'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const store = useAdminAuditStore()
const channelInput = ref('')
const channelInputRef = ref<HTMLInputElement | null>(null)

const normalizeHandle = (h: string): string => h.trim().replace(/^@/, '')

const addChannel = () => {
  const h = normalizeHandle(channelInput.value)
  if (h && !store.channelHandles.includes(h)) {
    store.setChannelHandles([...store.channelHandles, h])
    channelInput.value = ''
    channelInputRef.value?.focus()
  }
}

const removeChannel = (handle: string) => {
  store.setChannelHandles(store.channelHandles.filter((h) => h !== handle))
}

const runAudit = async () => {
  addChannel()
  if (store.channelHandles.length === 0) return
  await store.runAudit(store.channelHandles)
}

const deadLinksWithRevenue = computed(() => {
  const dead = store.linkResults.filter((r) => r.category === 'dead')
  const videoMap = new Map(store.videos.map((v) => [v.id, v]))
  return dead.map((r) => {
    const { revenueLoss } = getRevenueLossForLink(r, store.videos, { userSponsors: [] })
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

const commentsStatus = computed(() => {
  if (store.isFetchingComments) return 'loading'
  if (store.highIntentComments.length > 0) return 'hasComments'
  if (store.hasCommentsLoaded) return 'none'
  return 'idle'
})

onMounted(() => {
  if (store.hasVideos && store.channelHandles.length > 0) store.loadCommentsFromCache()
})
</script>
