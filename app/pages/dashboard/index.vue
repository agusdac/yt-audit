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
      <div v-if="!store.hasVideos" class="rounded-card p-8 bg-card-bg border border-border-default text-center">
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
          :disabled="store.isLoading || store.isCheckingLinks" @click="store.runAudit">
          {{ store.isLoading ? 'Auditing...' : store.isCheckingLinks ? 'Checking links...' : 'Run Audit' }}
        </button>
      </div>

      <template v-else>
        <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 class="text-2xl font-bold text-text-primary">Dashboard</h1>
          <div class="flex items-center gap-3">
            <span v-if="store.lastAuditAt" class="text-sm text-text-muted">
              Last audit: {{ formatRelativeTime(store.lastAuditAt) }}
            </span>
            <button type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention disabled:opacity-60"
              :disabled="store.isLoading || store.isCheckingLinks" @click="store.runAudit">
              {{ store.isLoading ? 'Auditing...' : store.isCheckingLinks ? 'Checking links...' : 'Run Audit' }}
            </button>
            <NuxtLink to="/videos"
              class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to">
              View all videos
            </NuxtLink>
          </div>
        </div>

        <div v-if="store.isLoading || store.isCheckingLinks" class="mb-6">
          <AuditSkeleton />
          <p v-if="store.isCheckingLinks" class="text-sm text-text-muted mt-2">Checking links...</p>
        </div>

        <template v-else>
          <div v-if="totalRevenueLoss > 0"
            class="rounded-card px-6 py-5 bg-error-bg border-2 border-error-border text-center mb-6">
            <p class="text-3xl md:text-4xl font-bold text-error-text">
              You're losing ~${{ Math.round(totalRevenueLoss) }}/month to dead links
            </p>
            <p class="text-sm mt-2 text-error-text/80">Fix the links below to stop the bleed.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="rounded-card px-5 py-4 bg-stat-bg border border-border-default">
              <span class="text-sm block text-text-muted">Videos scanned</span>
              <p class="text-2xl font-bold text-text-primary">{{ store.videos.length }}</p>
            </div>
            <div class="rounded-card px-5 py-4 bg-error-bg border border-error-border">
              <span class="text-sm block text-error-text/80">Dead links</span>
              <p class="text-2xl font-bold text-error-text">{{ store.deadLinksCount }}</p>
            </div>
            <div class="rounded-card px-5 py-4 bg-stat-bg border border-border-default">
              <span class="text-sm block text-text-muted">Est. revenue loss</span>
              <p class="text-2xl font-bold text-text-primary">~${{ Math.round(totalRevenueLoss) }}/mo</p>
            </div>
          </div>

          <DeadLinkWatchdog :items="deadLinksWithRevenue" />

          <div v-if="store.deadLinksCount === 0 && store.linkResults.length > 0"
            class="rounded-card p-6 bg-card-bg border border-border-default">
            <p class="text-merch-link font-medium">No dead links found. All checked links are OK or redirected.</p>
          </div>

          <div v-if="store.hasVideos && store.linkResults.length === 0"
            class="rounded-card p-6 bg-card-bg border border-border-default">
            <p class="text-text-muted mb-2">Run a link check to see which links are dead or redirected.</p>
            <NuxtLink to="/videos"
              class="inline-block px-4 py-2 rounded-button text-sm font-medium bg-btn-from text-white hover:opacity-90">
              Check links in All Videos
            </NuxtLink>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getRevenueLossForLink } from '~~/utils/revenue'
import { formatRelativeTime } from '~~/utils/format'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})

const store = useCreatorWorkspaceStore()
const config = useRuntimeConfig()

onMounted(async () => {
  if (!store.me) await store.fetchMe()
  if (config.public.autoRunAuditOnLogin && store.me?.linkedChannels?.length && !store.hasVideos) {
    const cached = await store.loadFromCache()
    if (!cached) {
      await store.runAudit()
      if (store.videos.length > 0) await store.runLinkCheck()
    }
  }
})

const deadLinksWithRevenue = computed(() => {
  const dead = store.linkResults.filter((r) => r.category === 'dead')
  return dead.map((r) => {
    const { revenueLoss } = getRevenueLossForLink(r, store.videos, { userSponsors: [] })
    return {
      url: r.url,
      videoIds: r.videoIds ?? [],
      revenueLoss,
      firstVideoId: (r.videoIds ?? [])[0]
    }
  })
})

const totalRevenueLoss = computed(() =>
  deadLinksWithRevenue.value.reduce((sum, i) => sum + i.revenueLoss, 0)
)
</script>
