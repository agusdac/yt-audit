<template>
  <div class="space-y-6">
    <div v-if="props.error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text">
      <span class="text-2xl">&#9888;</span>
      <span>{{ props.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="props.onClearError?.()">
        Dismiss
      </button>
    </div>

    <div class="flex items-center justify-between flex-wrap gap-4">
      <h1 class="text-2xl font-bold text-text-primary">Dashboard</h1>
      <div class="flex items-center gap-3">
        <span v-if="props.lastAuditAt" class="text-sm text-text-muted">
          Last audit: {{ formatRelativeTime(props.lastAuditAt) }}
        </span>
        <button
          type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="props.isLoading || props.isCheckingLinks"
          @click="props.onRunAudit?.()"
        >
          {{ props.isLoading ? 'Auditing...' : props.isCheckingLinks ? 'Checking links...' : 'Run Audit' }}
        </button>
        <NuxtLink
          :to="props.viewVideosHref"
          class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
        >
          View all videos
        </NuxtLink>
      </div>
    </div>

    <div v-if="props.isLoading || props.isCheckingLinks">
      <AuditSkeleton />
      <p v-if="props.isCheckingLinks" class="text-sm text-text-muted mt-2">Checking links...</p>
    </div>

    <template v-else>
      <RevenueScoreHero
        :total-revenue-loss="props.totalRevenueLoss"
        :dead-links-count="props.deadLinksCount"
        :has-link-results="props.linkResults.length > 0"
      />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <DeadLinkWatchdog :items="props.deadLinksWithRevenue" :max-visible="props.maxVisibleDeadLinks" />

          <div v-if="props.deadLinksCount === 0 && props.linkResults.length > 0"
            class="rounded-card p-6 bg-card-bg border border-border-default">
            <p class="text-merch-link font-medium">No dead links found. All checked links are OK or redirected.</p>
          </div>

          <div v-if="props.hasVideos && props.linkResults.length === 0"
            class="rounded-card p-6 bg-card-bg border border-border-default">
            <p class="text-text-muted mb-2">Run a link check to see which links are dead or redirected.</p>
            <slot name="check-links-cta">
              <NuxtLink
                :to="props.viewVideosHref"
                class="inline-block px-4 py-2 rounded-button text-sm font-medium bg-btn-from text-white hover:opacity-90"
              >
                Check links in All Videos
              </NuxtLink>
            </slot>
          </div>
        </div>

        <div class="lg:col-span-1">
          <HighIntentWidget
            :comments-status="props.commentsStatus"
            :high-intent-comments="props.highIntentComments"
            :has-videos="props.hasVideos"
            :is-fetching-comments="props.isFetchingComments"
            :view-comments-href="props.viewCommentsHref"
            :on-fetch-comments="props.onFetchComments"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import type { HighIntentComment } from '~~/stores/creatorWorkspace'
import { formatRelativeTime } from '~~/utils/format'

const props = withDefaults(
  defineProps<{
    videos: VideoDetails[]
    linkResults: LinkCheckResult[]
    highIntentComments: HighIntentComment[]
    totalRevenueLoss: number
    deadLinksWithRevenue: Array<{ url: string; videoIds: string[]; revenueLoss: number; firstVideoId?: string }>
    deadLinksCount: number
    isLoading: boolean
    isCheckingLinks: boolean
    isFetchingComments: boolean
    commentsStatus: 'idle' | 'loading' | 'hasComments' | 'none'
    hasVideos: boolean
    lastAuditAt: Date | null
    error: string | null
    viewVideosHref: string
    viewCommentsHref: string
    maxVisibleDeadLinks?: number
    onRunAudit?: () => void
    onRunLinkCheck?: () => void
    onFetchComments?: () => void
    onLoadCommentsFromCache?: () => void
    onClearError?: () => void
  }>(),
  { maxVisibleDeadLinks: 3 }
)
</script>
