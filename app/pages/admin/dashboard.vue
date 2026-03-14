<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
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
              ×
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
          {{ store.isLoading ? 'Auditing...' : store.isCheckingLinks ? 'Checking links...' : 'Run Audit' }}
        </button>
      </div>

      <div v-if="store.error"
        class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
        <span class="text-2xl">⚠️</span>
        <span>{{ store.error }}</span>
        <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
      </div>

      <div v-if="store.isLoading || store.isCheckingLinks" class="mb-6">
        <p class="text-text-muted mb-4">{{ store.isCheckingLinks ? 'Checking links...' : 'Fetching videos...' }}</p>
        <AuditSkeleton />
      </div>

      <template v-else-if="store.hasVideos">
        <div v-if="totalRevenueLoss > 0"
          class="rounded-card px-6 py-5 bg-error-bg border-2 border-error-border text-center mb-6">
          <p class="text-3xl md:text-4xl font-bold text-error-text">
            ~${{ Math.round(totalRevenueLoss) }}/month estimated revenue loss from dead links
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
          class="rounded-card p-6 bg-card-bg border border-border-default mb-6">
          <p class="text-merch-link font-medium">No dead links found. All checked links are OK or redirected.</p>
        </div>

        <div v-if="store.hasVideos && store.linkResults.length === 0"
          class="rounded-card p-6 bg-card-bg border border-border-default mb-6">
          <p class="text-text-muted mb-2">Run a link check to see which links are dead or redirected.</p>
          <button
            type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-btn-from text-white hover:opacity-90"
            @click="store.runLinkCheck"
          >
            Check links
          </button>
        </div>

        <NuxtLink
          to="/admin/audit"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
        >
          View all videos
        </NuxtLink>
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
  if (store.videos.length > 0) await store.runLinkCheck()
}

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
