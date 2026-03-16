<template>
  <div class="space-y-8">
    <!-- Filters (top, compact) -->
    <div class="rounded-card p-4 bg-filter-bg border border-border-default sticky top-0 z-10 bg-page-bg/95 backdrop-blur flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2">
        <span class="text-sm font-medium text-text-muted">Search:</span>
        <input v-model="searchQuery" type="text" placeholder="Filter by title..."
          class="px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted w-40 sm:w-48" />
      </label>
      <span class="text-sm font-medium text-text-muted">Link type:</span>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterSponsor ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="filterSponsor = !filterSponsor">Sponsor</button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterAffiliate ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="filterAffiliate = !filterAffiliate">Affiliate</button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterMerch ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="filterMerch = !filterMerch">Merch</button>
      <span class="text-sm font-medium text-text-muted">Sort:</span>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="sortBy === 'date' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="sortBy = 'date'">Date</button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="sortBy === 'views' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="sortBy = 'views'">Views</button>
      <button v-if="Object.keys(props.videoScores ?? {}).length > 0" type="button"
        class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="sortBy === 'score' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="sortBy = 'score'">Score</button>
      <button v-if="hasVideosWithRevenueLoss" type="button"
        class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="sortBy === 'revenue' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="sortBy = 'revenue'">Revenue</button>
      <button type="button"
        class="filter-btn px-2 py-1.5 rounded-button text-sm font-medium transition-all border bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover"
        :title="sortDirection === 'desc' ? 'Descending' : 'Ascending'"
        @click="sortDirection = sortDirection === 'desc' ? 'asc' : 'desc'">
        <span v-if="sortDirection === 'desc'">↓</span><span v-else>↑</span>
      </button>
      <span class="text-sm font-medium text-text-muted">Type:</span>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterType === 'short' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="filterType = filterType === 'short' ? null : 'short'">Short</button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterType === 'live' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="filterType = filterType === 'live' ? null : 'live'">Live</button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterType === 'video' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="filterType = filterType === 'video' ? null : 'video'">Video</button>
      <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterPaidPlacement ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
        @click="filterPaidPlacement = !filterPaidPlacement">Paid</button>
      <button v-if="hasFiltersActive" type="button"
        class="px-3 py-1.5 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention hover:text-text-primary"
        @click="clearFilters">
        Clear filters
      </button>
    </div>

    <!-- Stats row -->
    <div class="flex gap-4 overflow-x-auto pb-2 scroll-area" role="status" aria-live="polite" aria-atomic="true">
      <div class="rounded-card px-5 py-3 bg-card-bg border border-border-default flex-shrink-0">
        <span class="text-sm block text-text-muted">Videos scanned</span>
        <p class="text-2xl font-bold text-text-primary">{{ props.videos.length }}</p>
      </div>
      <div v-if="linkResults.length > 0"
        class="rounded-card px-5 py-3 bg-error-bg/30 border border-error-border flex-shrink-0">
        <span class="text-sm block text-error-text/80">Dead</span>
        <p class="text-2xl font-bold text-error-text">{{ deadLinksCount }}</p>
      </div>
      <div v-if="linkResults.length > 0"
        class="rounded-card px-5 py-3 bg-alert-bg/30 border border-alert-border flex-shrink-0">
        <span class="text-sm block text-alert-text-muted">Redirected</span>
        <p class="text-2xl font-bold text-alert-text">{{ redirectedLinksCount }}</p>
      </div>
      <div v-if="linkResults.length > 0"
        class="rounded-card px-5 py-3 bg-merch-bg/20 border border-merch-border flex-shrink-0">
        <span class="text-sm block text-text-muted">OK</span>
        <p class="text-2xl font-bold text-merch-link">{{ okLinksCount }}</p>
      </div>
      <div v-if="codeIssuesCount > 0"
        class="rounded-card px-5 py-3 bg-alert-bg/30 border border-alert-border flex-shrink-0">
        <span class="text-sm block text-alert-text-muted">Code issues</span>
        <p class="text-2xl font-bold text-alert-text">{{ codeIssuesCount }}</p>
      </div>
    </div>

    <!-- Actions (sponsors, link check, export) -->
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2">
        <span class="text-sm text-text-muted">My sponsors:</span>
        <input v-model="userSponsorsInput" type="text" placeholder="nordvpn.com, expressvpn.com"
          class="px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted w-64"
          @blur="parseUserSponsors" />
      </label>
      <button v-if="userSponsors.length > 0" type="button"
        class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
        :class="filterMySponsors ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-filter-bg border-filter-border text-filter-text hover:bg-filter-bg-hover hover:border-filter-border-hover'"
        @click="filterMySponsors = !filterMySponsors">
        Only my sponsors
      </button>
      <label v-if="userSponsors.length > 0 && allLinksCount > 0" class="flex items-center gap-2 cursor-pointer">
        <input v-model="checkOnlyMySponsors" type="checkbox" class="rounded" />
        <span class="text-sm text-text-muted">Check only my sponsor links</span>
      </label>
      <template v-if="allLinksCount > 0">
        <div v-if="isCheckingLinks" class="rounded-card p-4 bg-card-bg border border-border-default flex items-center gap-3">
          <div class="w-8 h-8 rounded-full border-2 border-border-default border-t-btn-from animate-spin flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-medium text-text-primary">Checking links</p>
            <p class="text-sm text-text-muted">{{ linkCheckProgress }}</p>
          </div>
          <div class="flex-1 h-1.5 rounded-full bg-border-default overflow-hidden min-w-24">
            <div class="h-full bg-gradient-to-r from-btn-from to-btn-to transition-all duration-300"
              :style="{ width: `${linkCheckProgressPercent}%` }" />
          </div>
        </div>
        <div v-else class="flex flex-wrap items-center gap-2">
          <button type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            @click="runLinkCheckWithParse">
            Check {{ linksToCheckCount }} links
          </button>
          <button v-if="linkResults.length > 0" type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all"
            @click="exportCsv">Export CSV</button>
          <button v-if="linkResults.length > 0" type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all"
            @click="exportJson">Export JSON</button>
          <button type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention hover:border-border-attention transition-all"
            @click="clearCache">Clear cache</button>
        </div>
        <div v-if="linkCheckError"
          class="rounded-card px-4 py-3 flex items-center justify-between gap-3 bg-error-bg border border-error-border text-error-text">
          <span>{{ linkCheckError }}</span>
          <button type="button" class="px-3 py-1 rounded-button text-sm font-medium bg-error-bg hover:opacity-90"
            @click="retryLinkCheckWithParse">Retry</button>
        </div>
      </template>
    </div>

    <!-- Revenue loss banner -->
    <div v-if="totalDeadLinkRevenueLoss > 0"
      class="rounded-card px-6 py-5 bg-error-bg/30 border border-error-border text-center">
      <p class="text-3xl md:text-4xl font-bold text-error-text">
        You're losing ~${{ Math.round(totalDeadLinkRevenueLoss) }}/month to dead links
      </p>
      <p class="text-sm mt-2 text-error-text/80">Fix the links below to stop the bleed.</p>
    </div>

    <!-- Dead links -->
    <LinkIssuesCard
      v-if="deadLinksWithRevenue.length > 0"
      variant="dead"
      title="Dead links — fix these first"
      :items="deadLinksWithRevenue"
      :replacement-urls="replacementUrls"
      @update:replacement="(url, value) => replacementUrls[url] = value"
      @copy-replacement-list="copyReplacementList"
      @copy-studio-urls="copyStudioUrls"
    />

    <!-- Simple dead links (no revenue data) -->
    <div v-else-if="deadLinksCount > 0"
      class="rounded-card flex items-start gap-4 px-5 py-4 bg-error-bg/20 border border-error-border">
      <span class="text-4xl">🔗</span>
      <div class="flex-1">
        <p class="font-bold text-lg text-error-text">
          {{ deadLinksCount }} dead link{{ deadLinksCount > 1 ? 's' : '' }} found
        </p>
        <p class="text-sm mt-1 text-error-text/80">
          These URLs return 404 or 5xx errors. Update or remove them from your video descriptions.
        </p>
      </div>
    </div>

    <!-- Redirected links -->
    <LinkIssuesCard
      v-if="redirectedLinksWithRevenue.length > 0"
      variant="redirected"
      title="Redirected links"
      :items="redirectedLinksWithRevenue"
      :replacement-urls="replacementUrls"
      @update:replacement="(url, value) => replacementUrls[url] = value"
      @copy-replacement-list="copyReplacementList"
      @copy-studio-urls="copyStudioUrls"
    />

    <!-- Code issues -->
    <div v-if="codeIssuesCount > 0" class="rounded-card bg-alert-bg/20 border border-alert-border overflow-hidden">
      <button type="button"
        class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-filter-bg transition-colors"
        @click="codeIssuesOpen = !codeIssuesOpen">
        <span class="text-2xl">🎟️</span>
        <p class="flex-1 font-bold text-lg text-alert-text">
          {{ codeIssuesCount }} link{{ codeIssuesCount > 1 ? 's' : '' }} may have expired codes
        </p>
        <span class="text-alert-text text-xl transition-transform flex-shrink-0"
          :class="codeIssuesOpen ? 'rotate-180' : ''">▼</span>
      </button>
      <div v-show="codeIssuesOpen" class="px-5 pb-4 pt-0">
        <p class="text-sm text-alert-text-muted">
          Sponsor may have removed the code—you could be giving free advertising. Verify and update.
        </p>
      </div>
    </div>

    <!-- Export replacement list -->
    <div v-if="(deadLinksWithRevenue.length > 0 || redirectedLinksWithRevenue.length > 0) && hasAnyReplacement"
      class="rounded-card p-4 bg-filter-bg border border-border-default flex flex-wrap gap-2">
      <button type="button"
        class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
        @click="copyAllReplacements">
        {{ copiedAllReplacements ? 'Copied!' : 'Copy replacement list' }}
      </button>
      <button type="button"
        class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
        @click="exportReplacementCsv">
        Export replacement list (CSV)
      </button>
    </div>

    <!-- Results count -->
    <p class="text-sm text-text-muted">
      {{ resultsCountText }}
    </p>

    <!-- Video list -->
    <div v-if="filteredVideos.length === 0 && props.videos.length > 0"
      class="rounded-card p-8 bg-filter-bg border border-border-default text-center">
      <p class="text-text-muted">No videos match your filters. Clear filters to see all.</p>
      <button type="button"
        class="mt-3 px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
        @click="clearFilters">
        Clear filters
      </button>
    </div>
    <div v-else class="space-y-4" role="list" aria-label="Videos">
        <div v-for="video in paginatedVideos" :key="video.id"
          :ref="(el) => { if (video.id === props.highlightVideoId) highlightRef = el as HTMLElement }"
          :class="video.id === props.highlightVideoId ? 'ring-2 ring-border-default rounded-card -m-0.5 p-0.5' : ''">
          <VideoCard :video="video" :has-monetization-links="hasMonetizationLinks(video.links)"
            :video-score="props.videoScores?.[video.id]"
            :revenue-loss="revenueLossByVideoId.get(video.id)"
            :link-status="getLinkStatusForVideo(video.id)"
            :is-user-sponsor-link="isUserSponsorLink" :has-code-issue="hasCodeIssue" :link-class="linkClass" />
        </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 py-4">
        <button type="button"
          class="px-4 py-2 rounded-button font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention"
          :disabled="currentPage === 1" @click="currentPage = currentPage - 1">
          Previous
        </button>
        <span class="text-sm text-text-muted">
          {{ paginationRangeText }}
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
import type { Ref } from 'vue'
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'
import type { VideoDetails, VideoType } from '~~/types/youtube'
import type { CategorizedLinks } from '~~/utils/url'
import type { LinkCheckResult } from '~~/types/links'
import { getLinksToCheck } from '~~/utils/url'
import { useLinkCheck } from '~~/composables/useLinkCheck'
import { getRevenueLossForLink, estimateMonthlyViews } from '~~/utils/revenue'

const props = withDefaults(
  defineProps<{
    videos: VideoDetails[]
    syncLinkResultsToStore?: boolean
    linkResultsRef?: Ref<LinkCheckResult[]>
    highlightVideoId?: string
    videoScores?: Record<string, number>
  }>(),
  { syncLinkResultsToStore: false }
)

const PAGE_SIZE = 10

const codeIssuesOpen = ref(false)
const searchQuery = ref('')
const filterSponsor = ref(false)
const filterAffiliate = ref(false)
const filterMerch = ref(false)
const filterType = ref<VideoType | null>(null)
const filterPaidPlacement = ref(false)
const filterMySponsors = ref(false)
const userSponsorsInput = ref('')
const sortBy = ref<'date' | 'views' | 'score' | 'revenue'>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')
const userSponsors = ref<string[]>([])
const checkOnlyMySponsors = ref(false)
const currentPage = ref(1)
const highlightRef = ref<HTMLElement | null>(null)
const replacementUrls = ref<Record<string, string>>({})
const copiedAllReplacements = ref(false)

const parseUserSponsors = () => {
  userSponsors.value = userSponsorsInput.value
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}

const store = props.syncLinkResultsToStore ? useCreatorWorkspaceStore() : null
const storeRefs = store ? storeToRefs(store) : null
const linkResultsRef = props.linkResultsRef ?? (storeRefs?.linkResults ?? undefined)
const linkCheck = useLinkCheck(
  () => props.videos,
  {
    userSponsors: () => userSponsors.value,
    checkOnlyMySponsors: () => checkOnlyMySponsors.value,
    ...(linkResultsRef && { linkResultsRef })
  }
)

const {
  linkResults,
  isCheckingLinks,
  linkCheckProgress,
  linkCheckProgressPercent,
  deadLinksCount,
  redirectedLinksCount,
  okLinksCount,
  codeIssuesCount,
  linkCheckError,
  allLinksCount,
  linksToCheckCount,
  getLinkResult,
  hasCodeIssue,
  linkClass,
  runLinkCheck,
  retryLinkCheck,
  exportCsv,
  exportJson,
  clearCache
} = linkCheck

const isUserSponsorLink = (url: string): boolean =>
  userSponsors.value.some(domain => url.toLowerCase().includes(domain))

const videoHasUserSponsorLinks = (video: VideoDetails): boolean => {
  const links = getLinksToCheck(video.links)
  return links.some(isUserSponsorLink)
}

const hasMonetizationLinks = (links: CategorizedLinks): boolean => {
  const { sponsors, affiliates, merch, socialWithRevenue, other } = links
  return sponsors.length > 0 || affiliates.length > 0 || merch.length > 0 || socialWithRevenue.length > 0 || other.length > 0
}

const getLinkStatusForVideo = (videoId: string): { dead: number; redirected: number } | undefined => {
  const results = linkResults.value.filter((r) => r.videoIds?.includes(videoId))
  if (results.length === 0) return undefined
  const dead = results.filter((r) => r.category === 'dead').length
  const redirected = results.filter((r) => r.category === 'redirected').length
  return { dead, redirected }
}

const matchesLinkFilter = (video: VideoDetails): boolean => {
  if (!filterSponsor.value && !filterAffiliate.value && !filterMerch.value) return true
  const { sponsors, affiliates, merch, socialWithRevenue, other } = video.links
  if (filterSponsor.value && sponsors.length > 0) return true
  if (filterAffiliate.value && affiliates.length > 0) return true
  if (filterMerch.value && (merch.length > 0 || socialWithRevenue.length > 0 || other.length > 0)) return true
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

const matchesSearchFilter = (video: VideoDetails): boolean => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return true
  return video.title.toLowerCase().includes(q)
}

const revenueLossByVideoId = computed(() => {
  const map = new Map<string, number>()
  const deadWithRev = deadLinksWithRevenue.value
  for (const item of deadWithRev) {
    const videos = item.videoIds
      .map((id) => props.videos.find((v) => v.id === id))
      .filter((v): v is VideoDetails => !!v)
    const totalViews = videos.reduce((s, v) => s + estimateMonthlyViews(v.viewCount, v.publishedAt), 0)
    if (totalViews <= 0) continue
    for (const v of videos) {
      const share = estimateMonthlyViews(v.viewCount, v.publishedAt) / totalViews
      map.set(v.id, (map.get(v.id) ?? 0) + item.revenueLoss * share)
    }
  }
  return map
})

const hasVideosWithRevenueLoss = computed(() =>
  [...revenueLossByVideoId.value.values()].some((v) => v > 0)
)

const getSortCompare = () => {
  const scores = props.videoScores ?? {}
  const dir = sortDirection.value === 'asc' ? 1 : -1
  if (sortBy.value === 'date') {
    return (a: VideoDetails, b: VideoDetails) =>
      dir * (new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
  }
  if (sortBy.value === 'views') {
    return (a: VideoDetails, b: VideoDetails) => dir * (a.viewCount - b.viewCount)
  }
  if (sortBy.value === 'score') {
    return (a: VideoDetails, b: VideoDetails) => {
      const aScore = scores[a.id] ?? -1
      const bScore = scores[b.id] ?? -1
      return dir * (aScore - bScore)
    }
  }
  if (sortBy.value === 'revenue') {
    const revMap = revenueLossByVideoId.value
    return (a: VideoDetails, b: VideoDetails) => {
      const aRev = revMap.get(a.id) ?? -1
      const bRev = revMap.get(b.id) ?? -1
      return dir * (aRev - bRev)
    }
  }
  return (a: VideoDetails, b: VideoDetails) => dir * (a.viewCount - b.viewCount)
}

/** Base sort: monetization links first, then by selected sort */
const baseSort = (a: VideoDetails, b: VideoDetails) => {
  const aHas = hasMonetizationLinks(a.links) ? 1 : 0
  const bHas = hasMonetizationLinks(b.links) ? 1 : 0
  if (aHas !== bHas) return bHas - aHas
  return getSortCompare()(a, b)
}

const filteredVideos = computed(() => {
  const filtered = props.videos.filter(v =>
    matchesLinkFilter(v) && matchesTypeFilter(v) && matchesPaidPlacementFilter(v) && matchesMySponsorsFilter(v) && matchesSearchFilter(v)
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

const hasFiltersActive = computed(() => {
  const q = searchQuery.value.trim()
  return (
    q.length > 0 ||
    filterSponsor.value ||
    filterAffiliate.value ||
    filterMerch.value ||
    filterType.value !== null ||
    filterPaidPlacement.value ||
    filterMySponsors.value
  )
})

const clearFilters = () => {
  searchQuery.value = ''
  filterSponsor.value = false
  filterAffiliate.value = false
  filterMerch.value = false
  filterType.value = null
  filterPaidPlacement.value = false
  filterMySponsors.value = false
  currentPage.value = 1
}

const resultsCountText = computed(() => {
  const total = filteredVideos.value.length
  const all = props.videos.length
  if (hasFiltersActive.value && total !== all) {
    return `Showing ${total} of ${all} videos`
  }
  return `${total} video${total !== 1 ? 's' : ''}`
})

const paginationRangeText = computed(() => {
  const total = filteredVideos.value.length
  const start = (currentPage.value - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage.value * PAGE_SIZE, total)
  return `Showing ${start}–${end} of ${total}`
})

watch([filterSponsor, filterAffiliate, filterMerch, filterType, filterPaidPlacement, filterMySponsors, sortBy, sortDirection, searchQuery], () => {
  currentPage.value = 1
})

watch(() => props.highlightVideoId, (id) => {
  if (id) {
    const idx = filteredVideos.value.findIndex((v) => v.id === id)
    if (idx >= 0) currentPage.value = Math.floor(idx / PAGE_SIZE) + 1
  }
}, { immediate: true })

watch([() => props.highlightVideoId, highlightRef, currentPage], async () => {
  if (props.highlightVideoId && highlightRef.value) {
    await nextTick()
    highlightRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}, { flush: 'post' })

onMounted(async () => {
  if (props.highlightVideoId) {
    const idx = filteredVideos.value.findIndex((v) => v.id === props.highlightVideoId)
    if (idx >= 0) currentPage.value = Math.floor(idx / PAGE_SIZE) + 1
    await nextTick()
    highlightRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
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

const creatorSettings = store?.creatorSettings
const mergedUserSponsors = computed(() => {
  const fromInput = userSponsors.value
  const fromSettings = creatorSettings?.sponsorDomains ?? []
  return [...new Set([...fromInput, ...fromSettings])]
})
const deadLinksWithRevenue = computed(() => {
  const dead = linkResults.value.filter(r => r.category === 'dead')
  return dead.map(r => {
    const { revenueLoss } = getRevenueLossForLink(r, props.videos, { userSponsors: mergedUserSponsors.value, creatorSettings: creatorSettings ?? undefined })
    return {
      url: r.url,
      videoIds: r.videoIds ?? [],
      revenueLoss,
      firstVideoId: (r.videoIds ?? [])[0]
    }
  })
})

const totalDeadLinkRevenueLoss = computed(() =>
  deadLinksWithRevenue.value.reduce((sum, i) => sum + i.revenueLoss, 0)
)

const runLinkCheckWithParse = () => {
  parseUserSponsors()
  runLinkCheck()
}

const retryLinkCheckWithParse = () => {
  parseUserSponsors()
  retryLinkCheck()
}

const redirectedLinksWithRevenue = computed(() => {
  const redirected = linkResults.value.filter((r) => r.category === 'redirected')
  return redirected.map((r) => ({
    url: r.url,
    videoIds: r.videoIds ?? [],
    revenueLoss: 0,
    firstVideoId: (r.videoIds ?? [])[0]
  }))
})

const hasAnyReplacement = computed(() => {
  const allItems = [...deadLinksWithRevenue.value, ...redirectedLinksWithRevenue.value]
  return allItems.some((item) => {
    const v = replacementUrls.value[item.url]
    return v && v.trim().startsWith('http')
  })
})

const escapeCsv = (s: string) => `"${String(s).replace(/"/g, '""')}"`

const copyAllReplacements = async () => {
  const allItems = [...deadLinksWithRevenue.value, ...redirectedLinksWithRevenue.value]
  const lines = allItems
    .map((item) => {
      const newUrl = replacementUrls.value[item.url]?.trim()
      if (!newUrl || !item.videoIds?.length) return null
      return `${item.url} → ${newUrl}`
    })
    .filter((l): l is string => l != null)
  if (lines.length === 0) return
  await navigator.clipboard.writeText(lines.join('\n'))
  copiedAllReplacements.value = true
  setTimeout(() => { copiedAllReplacements.value = false }, 2000)
}

const copyReplacementList = async (item: { url: string; videoIds: string[] }) => {
  const newUrl = replacementUrls.value[item.url]?.trim()
  if (!newUrl || !item.videoIds?.length) return
  const lines = item.videoIds.map((vid) => `${vid},${escapeCsv(item.url)},${escapeCsv(newUrl)}`).join('\n')
  const text = `videoId,oldUrl,newUrl\n${lines}`
  await navigator.clipboard.writeText(text)
}

const copyStudioUrls = async (videoIds: string[]) => {
  const urls = videoIds.map((id) => `https://studio.youtube.com/video/${id}/edit`).join('\n')
  await navigator.clipboard.writeText(urls)
}

const exportReplacementCsv = () => {
  const rows: Array<{ videoId: string; oldUrl: string; newUrl: string }> = []
  const allItems = [...deadLinksWithRevenue.value, ...redirectedLinksWithRevenue.value]
  for (const item of allItems) {
    const newUrl = replacementUrls.value[item.url]?.trim()
    if (!newUrl || !item.videoIds?.length) continue
    for (const vid of item.videoIds) {
      rows.push({ videoId: vid, oldUrl: item.url, newUrl })
    }
  }
  if (rows.length === 0) return
  const csv = 'videoId,oldUrl,newUrl\n' + rows.map((r) => `${r.videoId},${escapeCsv(r.oldUrl)},${escapeCsv(r.newUrl)}`).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `link-replacements-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

</script>
