<template>
  <div
    class="rounded-card border overflow-hidden transition-all duration-200"
    :class="hasMonetizationLinks ? 'bg-card-bg-attention border-border-attention hover:border-hover-border' : 'bg-card-bg border-border-default hover:border-hover-border'"
  >
    <div class="flex flex-col sm:flex-row gap-4 p-4">
      <NuxtLink
        :to="`/videos/${video.id}`"
        class="flex-shrink-0 w-full sm:w-48 rounded-lg overflow-hidden bg-thumb-bg block"
        :class="video.type === 'short' ? 'aspect-[9/16] sm:w-32' : 'aspect-video'"
      >
        <img
          :src="`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`"
          :alt="video.title"
          class="w-full h-full object-cover"
        />
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span
            v-if="video.channelHandle"
            class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-card-bg border border-border-default text-text-muted"
          >
            @{{ video.channelHandle }}
          </span>
          <span
            v-if="video.type !== 'video'"
            class="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase"
            :class="video.type === 'short' ? 'bg-sponsor-bg text-sponsor-text border border-sponsor-border' : 'bg-affiliate-bg text-affiliate-text border border-affiliate-border'"
          >
            {{ video.type }}
          </span>
          <span
            v-if="video.hasPaidProductPlacement"
            class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-merch-bg text-merch-text border border-merch-border"
          >
            Paid
          </span>
          <Tooltip
            v-if="videoScore != null"
            content="Metadata score—click for details"
            placement="top"
            trigger-class="inline-flex"
          >
            <span
              class="inline-flex px-2 py-0.5 rounded text-xs font-medium border cursor-default"
              :class="scoreBadgeClass"
            >
              {{ videoScore }}/100
            </span>
          </Tooltip>
          <span
            v-if="linkStatus && (linkStatus.dead > 0 || linkStatus.redirected > 0)"
            class="inline-flex gap-1 flex-wrap"
          >
            <span
              v-if="linkStatus.dead > 0"
              class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-error-bg/50 border border-error-border text-error-text"
            >
              {{ linkStatus.dead }} dead
            </span>
            <span
              v-if="linkStatus.redirected > 0"
              class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-alert-bg/50 border border-alert-border text-alert-text"
            >
              {{ linkStatus.redirected }} redirected
            </span>
          </span>
          <span
            v-else-if="linkStatus"
            class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-merch-bg/30 border border-merch-border text-merch-text"
          >
            OK
          </span>
        </div>
        <div class="flex items-start justify-between gap-2">
          <NuxtLink
            :to="`/videos/${video.id}`"
            class="font-semibold line-clamp-2 transition-colors block text-text-primary hover:text-hover-link flex-1 min-w-0"
          >
            {{ video.title }}
          </NuxtLink>
          <div class="flex flex-shrink-0 gap-1">
            <a
              :href="`https://www.youtube.com/watch?v=${video.id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="px-2 py-1 rounded-button text-xs font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention hover:border-border-attention hover:text-text-primary transition-all"
            >
              View in YouTube
            </a>
            <a
              :href="`https://studio.youtube.com/video/${video.id}/edit`"
              target="_blank"
              rel="noopener noreferrer"
              class="px-2 py-1 rounded-button text-xs font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention hover:border-border-attention hover:text-text-primary transition-all"
            >
              Edit in Studio
            </a>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-2 text-sm text-text-muted">
          <span>{{ formatViews(video.viewCount) }} views</span>
          <span v-if="video.likeCount != null">{{ formatViews(video.likeCount) }} likes</span>
          <span v-if="video.commentCount != null">{{ formatViews(video.commentCount) }} comments</span>
          <span>{{ formatDate(video.publishedAt) }}</span>
          <span>{{ formatDuration(video.duration) }}</span>
          <span
            v-if="revenueLoss != null && revenueLoss > 0"
            class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-error-bg/50 border border-error-border text-error-text"
          >
            ~${{ Math.round(revenueLoss) }}/mo loss
          </span>
        </div>
        <div class="mt-3 space-y-2">
          <LinkCategory
            v-if="video.links.sponsors.length > 0"
            label="SPONSOR"
            :urls="video.links.sponsors"
            class-name="sponsor"
            :is-user-sponsor-link="isUserSponsorLink"
            :has-code-issue="hasCodeIssue"
            :link-class="linkClass"
          />
          <LinkCategory
            v-if="video.links.affiliates.length > 0"
            label="AFFILIATE"
            :urls="video.links.affiliates"
            class-name="affiliate"
            :is-user-sponsor-link="isUserSponsorLink"
            :has-code-issue="hasCodeIssue"
            :link-class="linkClass"
          />
          <LinkCategory
            v-if="video.links.merch.length > 0"
            label="MERCH"
            :urls="video.links.merch"
            class-name="merch"
            :is-user-sponsor-link="isUserSponsorLink"
            :has-code-issue="hasCodeIssue"
            :link-class="linkClass"
          />
          <LinkCategory
            v-if="video.links.socialWithRevenue.length > 0"
            label="SUPPORT"
            :urls="video.links.socialWithRevenue"
            class-name="merch"
            :is-user-sponsor-link="isUserSponsorLink"
            :has-code-issue="hasCodeIssue"
            :link-class="linkClass"
          />
          <LinkCategory
            v-if="video.links.other.length > 0"
            label="OTHER"
            :urls="video.links.other"
            class-name="other"
            :is-user-sponsor-link="isUserSponsorLink"
            :has-code-issue="hasCodeIssue"
            :link-class="linkClass"
          />
          <div v-if="!hasMonetizationLinks" class="text-sm text-text-muted-strong">
            No sponsor/affiliate links detected
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VideoDetails } from '~~/types/youtube'
import type { CategorizedLinks } from '~~/utils/url'
import { formatViews, formatDate, formatDuration } from '~~/utils/format'
import LinkCategory from './LinkCategory.vue'
import Tooltip from './Tooltip.vue'

const props = defineProps<{
  video: VideoDetails
  hasMonetizationLinks: boolean
  videoScore?: number
  revenueLoss?: number
  linkStatus?: { dead: number; redirected: number }
  isUserSponsorLink: (url: string) => boolean
  hasCodeIssue: (url: string) => boolean
  linkClass: (url: string, defaultClass: string) => string
}>()

const scoreBadgeClass = computed(() => {
  const s = props.videoScore ?? 0
  if (s >= 80) return 'bg-merch-bg/30 border-merch-border text-merch-text'
  if (s >= 60) return 'bg-affiliate-bg/30 border-affiliate-border text-affiliate-text'
  if (s >= 40) return 'bg-alert-bg/30 border-alert-border text-alert-text'
  return 'bg-error-bg/30 border-error-border text-error-text'
})
</script>
