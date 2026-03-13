<template>
  <div class="space-y-6">
    <div v-if="needsAttentionCount > 0"
      class="rounded-card flex items-start gap-4 px-5 py-4 bg-alert-bg border-2 border-alert-border">
      <span class="text-4xl">⚠️</span>
      <div>
        <p class="font-bold text-lg text-alert-text">
          {{ needsAttentionCount }} video{{ needsAttentionCount > 1 ? 's' : '' }} have sponsor or affiliate links
        </p>
        <p class="text-sm mt-1 text-alert-text-muted">
          Check these links—expired codes and dead URLs hurt your credibility and revenue.
        </p>
      </div>
    </div>

    <div v-if="deadLinksCount > 0"
      class="rounded-card flex items-start gap-4 px-5 py-4 bg-error-bg border-2 border-error-border">
      <span class="text-4xl">🔗</span>
      <div>
        <p class="font-bold text-lg text-error-text">
          {{ deadLinksCount }} dead link{{ deadLinksCount > 1 ? 's' : '' }} found
        </p>
        <p class="text-sm mt-1 text-error-text/80">
          These URLs return 404 or 5xx errors. Update or remove them from your video descriptions.
        </p>
      </div>
    </div>

    <div v-if="redirectedLinksCount > 0"
      class="rounded-card flex items-start gap-4 px-5 py-4 bg-alert-bg border-2 border-alert-border">
      <span class="text-4xl">↪️</span>
      <div>
        <p class="font-bold text-lg text-alert-text">
          {{ redirectedLinksCount }} link{{ redirectedLinksCount > 1 ? 's' : '' }} redirect
        </p>
        <p class="text-sm mt-1 text-alert-text-muted">
          Consider updating for consistency—redirects work but may confuse viewers.
        </p>
      </div>
    </div>

    <div v-if="codeIssuesCount > 0"
      class="rounded-card flex items-start gap-4 px-5 py-4 bg-alert-bg border-2 border-alert-border">
      <span class="text-4xl">🎟️</span>
      <div>
        <p class="font-bold text-lg text-alert-text">
          {{ codeIssuesCount }} link{{ codeIssuesCount > 1 ? 's' : '' }} may have expired codes
        </p>
        <p class="text-sm mt-1 text-alert-text-muted">
          Sponsor may have removed the code—you could be giving free advertising. Verify and update.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-4">
      <div class="rounded-card px-5 py-3 bg-stat-bg border border-border-default">
        <span class="text-sm block text-text-muted">Videos scanned</span>
        <p class="text-2xl font-bold text-text-primary">{{ props.videos.length }}</p>
      </div>
      <div v-if="needsAttentionCount > 0"
        class="rounded-card px-5 py-3 bg-stat-attention-bg border border-stat-attention-border">
        <span class="text-sm block text-stat-attention-label">Need your attention</span>
        <p class="text-2xl font-bold text-stat-attention-text">{{ needsAttentionCount }}</p>
      </div>
      <div v-if="deadLinksCount > 0" class="rounded-card px-5 py-3 bg-error-bg border border-error-border">
        <span class="text-sm block text-error-text/80">Dead</span>
        <p class="text-2xl font-bold text-error-text">{{ deadLinksCount }}</p>
      </div>
      <div v-if="redirectedLinksCount > 0" class="rounded-card px-5 py-3 bg-alert-bg border border-alert-border">
        <span class="text-sm block text-alert-text-muted">Redirected</span>
        <p class="text-2xl font-bold text-alert-text">{{ redirectedLinksCount }}</p>
      </div>
      <div v-if="okLinksCount > 0 && linkResults.length > 0" class="rounded-card px-5 py-3 bg-stat-bg border border-border-default">
        <span class="text-sm block text-text-muted">OK</span>
        <p class="text-2xl font-bold text-merch-link">{{ okLinksCount }}</p>
      </div>
      <div v-if="codeIssuesCount > 0" class="rounded-card px-5 py-3 bg-alert-bg border border-alert-border">
        <span class="text-sm block text-alert-text-muted">Code issues</span>
        <p class="text-2xl font-bold text-alert-text">{{ codeIssuesCount }}</p>
      </div>
    </div>

    <!-- Filters: all on one line -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-text-muted mr-1">Filter:</span>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterSponsor ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterSponsor = !filterSponsor">
        Sponsor
      </button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterAffiliate ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterAffiliate = !filterAffiliate">
        Affiliate
      </button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterMerch ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterMerch = !filterMerch">
        Merch
      </button>
      <span class="text-text-muted/50 mx-1">|</span>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterType === 'short' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterType = filterType === 'short' ? null : 'short'">
        Short
      </button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterType === 'live' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterType = filterType === 'live' ? null : 'live'">
        Live
      </button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterType === 'video' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterType = filterType === 'video' ? null : 'video'">
        Video
      </button>
      <span class="text-text-muted/50 mx-1">|</span>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterPaidPlacement ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterPaidPlacement = !filterPaidPlacement">
        Paid placement
      </button>
    </div>

    <!-- My sponsors -->
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2">
        <span class="text-sm text-text-muted">My sponsors:</span>
        <input
          v-model="userSponsorsInput"
          type="text"
          placeholder="nordvpn.com, expressvpn.com"
          class="px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted w-64"
          @blur="parseUserSponsors"
        />
      </label>
      <button
        v-if="userSponsors.length > 0"
        type="button"
        class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterMySponsors ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterMySponsors = !filterMySponsors"
      >
        Only my sponsors
      </button>
      <label v-if="userSponsors.length > 0 && allLinksCount > 0" class="flex items-center gap-2 cursor-pointer">
        <input v-model="checkOnlyMySponsors" type="checkbox" class="rounded" />
        <span class="text-sm text-text-muted">Check only my sponsor links</span>
      </label>
      <label v-if="allLinksCount > 0" class="flex items-center gap-2 cursor-pointer">
        <input v-model="includeOtherLinks" type="checkbox" class="rounded" />
        <span class="text-sm text-text-muted">Include "other" links in check</span>
      </label>
    </div>

    <div v-if="allLinksCount > 0" class="flex flex-col gap-3">
      <div v-if="isCheckingLinks" class="rounded-card p-4 bg-card-bg border border-border-default">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-border-default border-t-btn-from animate-spin flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-medium text-text-primary">Checking links</p>
            <p class="text-sm text-text-muted">{{ linkCheckProgress }}</p>
          </div>
        </div>
        <div class="mt-3 h-1.5 rounded-full bg-border-default overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-btn-from to-btn-to transition-all duration-300"
            :style="{ width: `${linkCheckProgressPercent}%` }"
          />
        </div>
      </div>
      <div v-else class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          @click="runLinkCheck"
        >
          Check {{ linksToCheckCount }} links
        </button>
        <button
          v-if="linkResults.length > 0"
          type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all"
          @click="exportCsv"
        >
          Export CSV
        </button>
        <button
          v-if="linkResults.length > 0"
          type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all"
          @click="exportJson"
        >
          Export JSON
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention hover:border-border-attention transition-all"
          @click="clearCache"
        >
          Clear cache
        </button>
      </div>
      <div v-if="linkCheckError" class="rounded-card px-4 py-3 flex items-center justify-between gap-3 bg-error-bg border border-error-border text-error-text">
        <span>{{ linkCheckError }}</span>
        <button type="button" class="px-3 py-1 rounded-button text-sm font-medium bg-error-bg hover:opacity-90" @click="retryLinkCheck">
          Retry
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div v-for="video in paginatedVideos" :key="video.id"
        class="rounded-card border overflow-hidden transition-all duration-200" :class="hasMonetizationLinks(video.links)
          ? 'bg-card-bg-attention border-border-attention hover:border-hover-border'
          : 'bg-card-bg border-border-default hover:border-hover-border'">
        <div class="flex flex-col sm:flex-row gap-4 p-4">
          <a :href="`https://youtube.com/watch?v=${video.id}`" target="_blank" rel="noopener noreferrer"
            class="flex-shrink-0 w-full sm:w-48 rounded-lg overflow-hidden bg-thumb-bg"
            :class="video.type === 'short' ? 'aspect-[9/16] sm:w-32' : 'aspect-video'">
            <img :src="`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`" :alt="video.title"
              class="w-full h-full object-cover" />
          </a>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span v-if="video.type !== 'video'" class="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase"
                :class="video.type === 'short' ? 'bg-sponsor-bg text-sponsor-text border border-sponsor-border' : 'bg-affiliate-bg text-affiliate-text border border-affiliate-border'">
                {{ video.type }}
              </span>
              <span v-if="video.hasPaidProductPlacement"
                class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-merch-bg text-merch-text border border-merch-border">
                Paid
              </span>
            </div>
            <div class="flex items-start justify-between gap-2">
              <a :href="`https://youtube.com/watch?v=${video.id}`" target="_blank" rel="noopener noreferrer"
                class="font-semibold line-clamp-2 transition-colors block text-text-primary hover:text-hover-link flex-1 min-w-0">
                {{ video.title }}
              </a>
              <!-- TODO: Future: YouTube API or OAuth to edit descriptions directly -->
              <a
                :href="`https://studio.youtube.com/video/${video.id}/edit`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-shrink-0 px-2 py-1 rounded-button text-xs font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention hover:border-border-attention hover:text-text-primary transition-all"
              >
                Edit in Studio
              </a>
            </div>
            <div class="flex flex-wrap gap-3 mt-2 text-sm text-text-muted">
              <span>{{ formatViews(video.viewCount) }} views</span>
              <span>{{ formatDate(video.publishedAt) }}</span>
            </div>

            <div class="mt-3 space-y-2">
              <div v-if="video.links.sponsors.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sponsor-bg text-sponsor-text border border-sponsor-border">SPONSOR</span>
                <template v-for="url in video.links.sponsors" :key="url">
                  <span v-if="isUserSponsorLink(url)" class="text-xs text-alert-text">(My)</span>
                  <span v-if="hasCodeIssue(url)" class="text-xs text-alert-text" title="Code may be expired">⚠</span>
                  <a :href="url" target="_blank" rel="noopener noreferrer"
                    :class="['text-sm hover:underline truncate max-w-[200px]', linkClass(url, 'text-sponsor-link')]">
                    {{ url }}
                  </a>
                </template>
              </div>

              <div v-if="video.links.affiliates.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-affiliate-bg text-affiliate-text border border-affiliate-border">AFFILIATE</span>
                <template v-for="url in video.links.affiliates" :key="url">
                  <span v-if="isUserSponsorLink(url)" class="text-xs text-alert-text">(My)</span>
                  <span v-if="hasCodeIssue(url)" class="text-xs text-alert-text" title="Code may be expired">⚠</span>
                  <a :href="url" target="_blank" rel="noopener noreferrer"
                    :class="['text-sm hover:underline truncate max-w-[200px]', linkClass(url, 'text-affiliate-link')]">
                    {{ url }}
                  </a>
                </template>
              </div>

              <div v-if="video.links.merch.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-merch-bg text-merch-text border border-merch-border">MERCH</span>
                <template v-for="url in video.links.merch" :key="url">
                  <span v-if="isUserSponsorLink(url)" class="text-xs text-alert-text">(My)</span>
                  <span v-if="hasCodeIssue(url)" class="text-xs text-alert-text" title="Code may be expired">⚠</span>
                  <a :href="url" target="_blank" rel="noopener noreferrer"
                    :class="['text-sm hover:underline truncate max-w-[200px]', linkClass(url, 'text-merch-link')]">
                    {{ url }}
                  </a>
                </template>
              </div>

              <div v-if="video.links.socialWithRevenue.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-merch-bg text-merch-text border border-merch-border">SUPPORT</span>
                <template v-for="url in video.links.socialWithRevenue" :key="url">
                  <span v-if="isUserSponsorLink(url)" class="text-xs text-alert-text">(My)</span>
                  <span v-if="hasCodeIssue(url)" class="text-xs text-alert-text" title="Code may be expired">⚠</span>
                  <a :href="url" target="_blank" rel="noopener noreferrer"
                    :class="['text-sm hover:underline truncate max-w-[200px]', linkClass(url, 'text-merch-link')]">
                    {{ url }}
                  </a>
                </template>
              </div>

              <div v-if="video.links.other.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-other-bg text-other-text border border-other-border">OTHER</span>
                <template v-for="url in video.links.other" :key="url">
                  <span v-if="isUserSponsorLink(url)" class="text-xs text-alert-text">(My)</span>
                  <span v-if="hasCodeIssue(url)" class="text-xs text-alert-text" title="Code may be expired">⚠</span>
                  <a :href="url" target="_blank" rel="noopener noreferrer"
                    :class="['text-sm hover:underline truncate max-w-[200px]', linkClass(url, 'text-other-link')]">
                    {{ url }}
                  </a>
                </template>
              </div>

              <div v-if="!hasMonetizationLinks(video.links) && video.links.socialWithRevenue.length === 0" class="text-sm text-text-muted-strong">
                No sponsor/affiliate links detected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 py-4">
      <button type="button"
        class="px-4 py-2 rounded-button font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention"
        :disabled="currentPage === 1" @click="currentPage = currentPage - 1">
        Previous
      </button>
      <span class="text-sm text-text-muted">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button type="button"
        class="px-4 py-2 rounded-button font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention"
        :disabled="currentPage === totalPages" @click="currentPage = currentPage + 1">
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VideoDetails, VideoType } from '~~/types/youtube'
import type { CategorizedLinks } from '~~/utils/url'
import { normalizeUrl } from '~~/utils/url'
import type { LinkCheckResult } from '~~/types/links'
import { getCachedResult, setCachedResult, clearLinkCache } from '~~/utils/linkCache'

const props = defineProps<{
  videos: VideoDetails[]
}>()

const PAGE_SIZE = 10

const filterSponsor = ref(false)
const filterAffiliate = ref(false)
const filterMerch = ref(false)
const filterType = ref<VideoType | null>(null)
const filterPaidPlacement = ref(false)
const filterMySponsors = ref(false)
const userSponsorsInput = ref('')
const userSponsors = ref<string[]>([])
const checkOnlyMySponsors = ref(false)
const includeOtherLinks = ref(false)
const linkCheckError = ref('')
const currentPage = ref(1)

const parseUserSponsors = () => {
  userSponsors.value = userSponsorsInput.value
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}

const isUserSponsorLink = (url: string): boolean =>
  userSponsors.value.some(domain => url.toLowerCase().includes(domain))

const videoHasUserSponsorLinks = (video: VideoDetails): boolean => {
  const links = getLinksToCheck(video.links, includeOtherLinks.value)
  return links.some(isUserSponsorLink)
}
const linkResults = ref<LinkCheckResult[]>([])
const isCheckingLinks = ref(false)
const linkCheckElapsed = ref(0)
const linkCheckTotal = ref(0)
let linkCheckTimer: ReturnType<typeof setInterval> | null = null

/** ~200ms per link with 5-way parallel (was 900ms sequential) */
const MS_PER_LINK = 200

const linkCheckProgress = computed(() => {
  if (!isCheckingLinks.value || linkCheckTotal.value === 0) return ''
  const estTotalMs = linkCheckTotal.value * MS_PER_LINK
  const remaining = Math.max(0, estTotalMs - linkCheckElapsed.value)
  return `~${Math.ceil(remaining / 1000)}s remaining (${linkCheckTotal.value} links)`
})

const linkCheckProgressPercent = computed(() => {
  if (!isCheckingLinks.value || linkCheckTotal.value === 0) return 0
  const estTotalMs = linkCheckTotal.value * MS_PER_LINK
  return Math.min(99, (linkCheckElapsed.value / estTotalMs) * 100)
})

const deadLinksCount = computed(() => linkResults.value.filter(r => r.category === 'dead').length)
const redirectedLinksCount = computed(() => linkResults.value.filter(r => r.category === 'redirected').length)
const okLinksCount = computed(() => linkResults.value.filter(r => r.category === 'ok').length)
const codeIssuesCount = computed(() => linkResults.value.filter(r => r.codeMayBeInvalid).length)

const getLinkResult = (url: string): LinkCheckResult | undefined =>
  linkResults.value.find(r => normalizeUrl(r.url) === normalizeUrl(url))

const hasCodeIssue = (url: string): boolean =>
  getLinkResult(url)?.codeMayBeInvalid ?? false

const linkClass = (url: string, defaultColor: string): string => {
  const r = getLinkResult(url)
  if (!r) return defaultColor
  if (r.category === 'dead') return 'text-error-text line-through'
  if (r.category === 'redirected') return 'text-alert-text'
  return defaultColor
}

/** Links included in the dead/redirect check (excludes pure social like Twitch, Instagram) */
const getLinksToCheck = (links: CategorizedLinks, includeOther = false): string[] => {
  const base = [...links.sponsors, ...links.affiliates, ...links.merch, ...links.socialWithRevenue]
  if (includeOther) base.push(...links.other)
  return base
}

const allLinksCount = computed(() => {
  const seen = new Set<string>()
  props.videos.forEach(v => {
    getLinksToCheck(v.links, includeOtherLinks.value).forEach(url => seen.add(url))
  })
  return seen.size
})

const linksToCheckCount = computed(() => {
  if (!checkOnlyMySponsors.value || userSponsors.value.length === 0) return allLinksCount.value
  const seen = new Set<string>()
  props.videos.forEach(v => {
    getLinksToCheck(v.links, includeOtherLinks.value)
      .filter(isUserSponsorLink)
      .forEach(url => seen.add(url))
  })
  return seen.size
})

const hasMonetizationLinks = (links: CategorizedLinks): boolean => {
  const { sponsors, affiliates, merch, socialWithRevenue } = links
  return sponsors.length > 0 || affiliates.length > 0 || merch.length > 0 || socialWithRevenue.length > 0
}

const matchesLinkFilter = (video: VideoDetails): boolean => {
  if (!filterSponsor.value && !filterAffiliate.value && !filterMerch.value) return true
  const { sponsors, affiliates, merch, socialWithRevenue } = video.links
  if (filterSponsor.value && sponsors.length > 0) return true
  if (filterAffiliate.value && affiliates.length > 0) return true
  if (filterMerch.value && (merch.length > 0 || socialWithRevenue.length > 0)) return true
  return false
}

const matchesTypeFilter = (video: VideoDetails): boolean => {
  if (!filterType.value) return true
  return video.type === filterType.value
}

const matchesPaidPlacementFilter = (video: VideoDetails): boolean => {
  if (!filterPaidPlacement.value) return true
  return video.hasPaidProductPlacement
}

const matchesMySponsorsFilter = (video: VideoDetails): boolean => {
  if (!filterMySponsors.value || userSponsors.value.length === 0) return true
  return videoHasUserSponsorLinks(video)
}

/** Base sort: monetization links first, then by views */
const baseSort = (a: VideoDetails, b: VideoDetails) => {
  const aHas = hasMonetizationLinks(a.links) ? 1 : 0
  const bHas = hasMonetizationLinks(b.links) ? 1 : 0
  if (aHas !== bHas) return bHas - aHas
  return b.viewCount - a.viewCount
}

const filteredVideos = computed(() => {
  const filtered = props.videos.filter(v =>
    matchesLinkFilter(v) && matchesTypeFilter(v) && matchesPaidPlacementFilter(v) && matchesMySponsorsFilter(v)
  )

  if (linkResults.value.length === 0) {
    return [...filtered].sort(baseSort)
  }

  const deadVideoIds = new Set(
    linkResults.value.filter(r => r.category === 'dead').flatMap(r => r.videoIds)
  )
  const codeIssueVideoIds = new Set(
    linkResults.value.filter(r => r.codeMayBeInvalid).flatMap(r => r.videoIds)
  )
  const redirectedVideoIds = new Set(
    linkResults.value.filter(r => r.category === 'redirected').flatMap(r => r.videoIds)
  )

  return [...filtered].sort((a, b) => {
    const aDead = deadVideoIds.has(a.id) ? 1 : 0
    const bDead = deadVideoIds.has(b.id) ? 1 : 0
    if (aDead !== bDead) return bDead - aDead

    const aCode = codeIssueVideoIds.has(a.id) ? 1 : 0
    const bCode = codeIssueVideoIds.has(b.id) ? 1 : 0
    if (aCode !== bCode) return bCode - aCode

    const aRedirected = redirectedVideoIds.has(a.id) ? 1 : 0
    const bRedirected = redirectedVideoIds.has(b.id) ? 1 : 0
    if (aRedirected !== bRedirected) return bRedirected - aRedirected

    return baseSort(a, b)
  })
})

watch([filterSponsor, filterAffiliate, filterMerch, filterType, filterPaidPlacement, filterMySponsors, includeOtherLinks], () => {
  currentPage.value = 1
})

watch(() => linkResults.value.length, () => {
  currentPage.value = 1
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredVideos.value.length / PAGE_SIZE))
)

const paginatedVideos = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredVideos.value.slice(start, start + PAGE_SIZE)
})

const needsAttentionCount = computed(() =>
  props.videos.filter(v => hasMonetizationLinks(v.links)).length
)

const retryLinkCheck = () => {
  linkCheckError.value = ''
  runLinkCheck()
}

const runLinkCheck = async () => {
  parseUserSponsors()
  linkCheckError.value = ''

  const urlToVideoIds = new Map<string, string[]>()

  props.videos.forEach(video => {
    getLinksToCheck(video.links, includeOtherLinks.value)
      .filter(url => !checkOnlyMySponsors.value || userSponsors.value.length === 0 || isUserSponsorLink(url))
      .forEach(url => {
        const existing = urlToVideoIds.get(url) ?? []
        if (!existing.includes(video.id)) {
          existing.push(video.id)
          urlToVideoIds.set(url, existing)
        }
      })
  })

  const allUrls = [...urlToVideoIds.keys()]
  const cached: LinkCheckResult[] = []
  const toFetch: string[] = []

  for (const url of allUrls) {
    const c = getCachedResult(url)
    if (c) cached.push(c)
    else toFetch.push(url)
  }

  const merged = [...cached]
  linkResults.value = merged

  const checks = toFetch.map(url => ({ url, videoIds: urlToVideoIds.get(url) ?? [] }))
  const totalLinks = checks.length

  if (totalLinks === 0) return

  isCheckingLinks.value = true
  linkCheckTotal.value = totalLinks
  linkCheckElapsed.value = 0

  linkCheckTimer = setInterval(() => {
    linkCheckElapsed.value += 200
  }, 200)

  try {
    const res = await $fetch<{ linkResults: LinkCheckResult[] }>('/api/check-links', {
      method: 'POST',
      body: { checks }
    })
    const newResults = res.linkResults ?? []
    for (const r of newResults) {
      setCachedResult(r.url, r)
      merged.push(r)
    }
    linkResults.value = merged
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { message?: string }; message?: string }
    const status = err?.statusCode ?? (err as { status?: number })?.status
    const msg = err?.data?.message ?? err?.message ?? 'Link check failed'

    if (status === 429) {
      linkCheckError.value = 'Rate limit reached. Please wait a minute and try again.'
    } else if (err instanceof Error && err.message?.toLowerCase().includes('fetch')) {
      linkCheckError.value = 'Network error. Check your connection and try again.'
    } else {
      linkCheckError.value = msg
    }
  } finally {
    isCheckingLinks.value = false
    linkCheckElapsed.value = 0
    if (linkCheckTimer) {
      clearInterval(linkCheckTimer)
      linkCheckTimer = null
    }
  }
}

const exportCsv = () => {
  const rows = linkResults.value.flatMap(r =>
    (r.videoIds ?? []).map(vid => ({
      url: r.url,
      status: r.status,
      category: r.category,
      redirected: r.redirected,
      codeMayBeInvalid: r.codeMayBeInvalid ?? false,
      videoId: vid
    }))
  )
  const csv = [
    'url,status,category,redirected,codeMayBeInvalid,videoId',
    ...rows.map(r => `"${r.url.replace(/"/g, '""')}",${r.status},${r.category},${r.redirected},${r.codeMayBeInvalid},${r.videoId}`)
  ].join('\n')
  downloadFile(csv, `yt-audit-links-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
}

const exportJson = () => {
  const data = {
    exportedAt: new Date().toISOString(),
    linkResults: linkResults.value
  }
  downloadFile(JSON.stringify(data, null, 2), `yt-audit-links-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
}

const downloadFile = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const clearCache = () => {
  clearLinkCache()
  linkResults.value = []
}

const formatViews = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
</script>
