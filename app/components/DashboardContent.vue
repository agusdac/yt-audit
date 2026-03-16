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
      <div class="flex items-center gap-3 flex-wrap">
        <div v-if="props.lastAuditAt" class="flex items-center gap-2">
          <span class="text-sm text-text-muted">
            Last audit: {{ formatRelativeTime(props.lastAuditAt) }}
          </span>
          <span
            v-if="props.isCacheStale"
            class="px-2 py-0.5 rounded text-xs font-medium bg-alert-bg border border-alert-border text-alert-text"
          >
            Data may be stale
          </span>
        </div>
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

    <div v-if="props.isLoading || props.isCheckingLinks" class="mb-6">
      <p class="text-text-muted mb-2 font-medium">
        {{ props.isCheckingLinks ? 'Checking links...' : 'Running audit...' }}
      </p>
      <p class="text-text-muted text-sm mb-4">
        This can take several minutes for channels with many videos.
      </p>
      <ul class="text-sm text-text-muted/80 space-y-1 mb-4 list-disc list-inside">
        <li>{{ props.isCheckingLinks ? 'Verifying link status' : 'Fetching videos from YouTube' }}</li>
        <li>{{ props.isCheckingLinks ? 'Updating results' : 'Checking links' }}</li>
        <li>{{ props.isCheckingLinks ? 'Done soon' : 'Fetching comments' }}</li>
      </ul>
      <div class="h-1 rounded-full bg-border-default overflow-hidden mb-4">
        <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/3" />
      </div>
      <AuditSkeleton />
    </div>

    <template v-else>
      <div class="flex flex-col sm:flex-row gap-4 flex-wrap">
        <RevenueScoreHero
          :total-revenue-loss="props.totalRevenueLoss"
          :dead-links-count="props.deadLinksCount"
          :has-link-results="props.linkResults.length > 0"
        />
        <div class="flex gap-3 flex-wrap items-center">
          <div class="rounded-card px-3 py-2 bg-stat-bg border border-border-default">
            <span class="text-xs text-text-muted">Videos checked</span>
            <p class="text-lg font-bold text-text-primary">{{ props.videos.length }}</p>
          </div>
          <div class="rounded-card px-3 py-2 bg-stat-bg border border-border-default">
            <span class="text-xs text-text-muted">Affected by dead links</span>
            <p class="text-lg font-bold" :class="props.videosAffectedByDeadLinks > 0 ? 'text-error-text' : 'text-text-primary'">{{ props.videosAffectedByDeadLinks }}</p>
          </div>
          <div class="rounded-card px-3 py-2 bg-stat-bg border border-border-default">
            <span class="text-xs text-text-muted">Affected by comments</span>
            <p class="text-lg font-bold" :class="props.videosAffectedByComments > 0 ? 'text-alert-text' : 'text-text-primary'">{{ props.videosAffectedByComments }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <DeadLinkWatchdog :items="props.deadLinksWithRevenue" />

          <div v-if="(props.topVideosByRevenueLoss?.length ?? 0) > 0" class="rounded-card p-6 bg-card-bg border border-border-default">
            <h3 class="font-bold text-text-primary mb-3">Top videos by revenue loss</h3>
            <ul class="space-y-2">
              <li v-for="v in props.topVideosByRevenueLoss!.slice(0, 5)" :key="v.videoId" class="flex items-center justify-between gap-2">
                <NuxtLink
                  :to="`/videos/${v.videoId}`"
                  class="text-sm text-text-primary hover:text-hover-link truncate flex-1 min-w-0"
                >
                  {{ v.title }}
                </NuxtLink>
                <span class="text-sm font-medium text-error-text flex-shrink-0">~${{ Math.round(v.revenueLoss) }}/mo</span>
              </li>
            </ul>
          </div>

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

        <div class="lg:col-span-1 space-y-4">
          <div class="rounded-card p-4 bg-card-bg border-2 border-border-default">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xl">📧</span>
              <h3 class="font-semibold text-text-primary">Scheduled audit emails</h3>
            </div>
            <p class="text-sm text-text-muted mb-3">
              Get dead-link alerts by email so you never miss a broken link.
            </p>
            <p v-if="props.scheduledAuditEnabled" class="text-sm font-medium text-merch-link mb-2">
              Enabled · {{ props.scheduledAuditFrequency === 'monthly' ? 'Monthly' : 'Weekly' }}
            </p>
            <p v-else class="text-sm text-text-muted mb-2">
              Not enabled
            </p>
            <NuxtLink
              to="/settings"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
            >
              Manage in Settings →
            </NuxtLink>
          </div>
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
    deadLinksWithRevenue: Array<{ url: string; videoIds: string[]; revenueLoss: number; firstVideoId?: string; firstVideoTitle?: string }>
    topVideosByRevenueLoss?: Array<{ videoId: string; title: string; revenueLoss: number }>
    deadLinksCount: number
    videosAffectedByDeadLinks: number
    videosAffectedByComments: number
    isLoading: boolean
    isCheckingLinks: boolean
    isFetchingComments: boolean
    commentsStatus: 'idle' | 'loading' | 'hasComments' | 'none'
    hasVideos: boolean
    lastAuditAt: Date | null
    isCacheStale?: boolean
    error: string | null
    viewVideosHref: string
    viewCommentsHref: string
    scheduledAuditEnabled?: boolean
    scheduledAuditFrequency?: 'weekly' | 'monthly'
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
