<template>
  <div class="space-y-6">
    <!-- Revenue loss summary: prominent at top when dead links exist -->
    <div v-if="totalDeadLinkRevenueLoss > 0"
      class="rounded-card px-6 py-5 bg-error-bg border-2 border-error-border text-center">
      <p class="text-3xl md:text-4xl font-bold text-error-text">
        You're losing ~${{ Math.round(totalDeadLinkRevenueLoss) }}/month to dead links
      </p>
      <p class="text-sm mt-2 text-error-text/80">Fix the links below to stop the bleed.</p>
    </div>

    <!-- Dead links: fix these first -->
    <div v-if="deadLinksWithRevenue.length > 0"
      class="rounded-card bg-error-bg/40 border-2 border-error-border overflow-hidden">
      <button type="button"
        class="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-error-bg/30 transition-colors"
        @click="deadLinksOpen = !deadLinksOpen">
        <h3 class="font-bold text-lg text-error-text">Dead links — fix these first</h3>
        <span class="text-sm text-error-text/80">{{ deadLinksWithRevenue.length }} link{{ deadLinksWithRevenue.length >
          1 ? 's' : '' }}</span>
        <span class="text-error-text text-xl transition-transform" :class="deadLinksOpen ? 'rotate-180' : ''">▼</span>
      </button>
      <div v-show="deadLinksOpen" class="p-6 pt-0 space-y-4">
        <div v-for="item in deadLinksWithRevenue" :key="item.url"
          class="rounded-lg p-4 bg-card-bg border border-error-border space-y-3">
          <p class="text-sm text-error-text line-through break-all font-mono">{{ item.url }}</p>
          <p class="text-sm text-text-muted">
            {{ item.videoIds.length }} video{{ item.videoIds.length > 1 ? 's' : '' }} affected
            · ~${{ Math.round(item.revenueLoss) }}/month estimated loss
          </p>
          <div class="flex flex-wrap gap-2 items-center">
            <label class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-sm text-text-muted whitespace-nowrap">Replace with:</span>
              <input v-model="replacementUrls[item.url]" type="url" placeholder="https://new-link.com"
                class="flex-1 min-w-[200px] px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted" />
            </label>
          </div>
          <div class="flex flex-wrap gap-2">
            <a v-if="item.firstVideoId" :href="`https://studio.youtube.com/video/${item.firstVideoId}/edit`"
              target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold bg-error-bg border-2 border-error-border text-error-text hover:opacity-90 hover:border-error-text transition-all">
              Fix: Edit in YouTube Studio →
            </a>
            <button v-if="replacementUrls[item.url]" type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
              @click="copyReplacementList(item)">
              Copy replacement list
            </button>
            <button v-if="item.videoIds?.length" type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
              @click="copyStudioUrls(item.videoIds)">
              Copy Studio URLs
            </button>
        </div>
      </div>
    </div>
    </div>

    <div v-if="(deadLinksWithRevenue.length > 0 || redirectedLinksWithRevenue.length > 0) && hasAnyReplacement"
      class="rounded-card p-4 bg-filter-bg border border-border-default">
        <button type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
          @click="exportReplacementCsv">
          Export replacement list (CSV)
        </button>
      </div>

      <div v-else-if="deadLinksCount > 0"
        class="rounded-card flex items-start gap-4 px-5 py-4 bg-error-bg border-2 border-error-border">
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

      <div v-if="redirectedLinksWithRevenue.length > 0"
        class="rounded-card bg-alert-bg/40 border-2 border-alert-border overflow-hidden">
        <button type="button"
          class="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-alert-bg/30 transition-colors"
          @click="redirectedOpen = !redirectedOpen">
          <h3 class="font-bold text-lg text-alert-text">Redirected links</h3>
          <span class="text-sm text-alert-text/80">{{ redirectedLinksWithRevenue.length }} link{{
            redirectedLinksWithRevenue.length > 1 ? 's' : '' }}</span>
          <span class="text-alert-text text-xl transition-transform"
            :class="redirectedOpen ? 'rotate-180' : ''">▼</span>
        </button>
        <div v-show="redirectedOpen" class="p-6 pt-0 space-y-4">
          <div v-for="item in redirectedLinksWithRevenue" :key="item.url"
            class="rounded-lg p-4 bg-card-bg border border-alert-border space-y-3">
            <p class="text-sm text-alert-text break-all font-mono">{{ item.url }}</p>
            <p class="text-sm text-text-muted">
              {{ item.videoIds.length }} video{{ item.videoIds.length > 1 ? 's' : '' }} affected
            </p>
            <div class="flex flex-wrap gap-2 items-center">
              <label class="flex items-center gap-2 min-w-0 flex-1">
                <span class="text-sm text-text-muted whitespace-nowrap">Replace with:</span>
                <input v-model="replacementUrls[item.url]" type="url" placeholder="https://new-link.com"
                  class="flex-1 min-w-[200px] px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted" />
              </label>
            </div>
            <div class="flex flex-wrap gap-2">
              <a v-if="item.firstVideoId" :href="`https://studio.youtube.com/video/${item.firstVideoId}/edit`"
                target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold bg-alert-bg border-2 border-alert-border text-alert-text hover:opacity-90">
                Edit in YouTube Studio →
              </a>
              <button v-if="replacementUrls[item.url]" type="button"
                class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
                @click="copyReplacementList(item)">
                Copy replacement list
              </button>
              <button v-if="item.videoIds?.length" type="button"
                class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
                @click="copyStudioUrls(item.videoIds)">
                Copy Studio URLs
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="codeIssuesCount > 0" class="rounded-card bg-alert-bg border-2 border-alert-border overflow-hidden">
        <button type="button"
          class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-alert-bg/70 transition-colors"
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

      <div class="flex gap-4 overflow-x-auto pb-2" role="status" aria-live="polite" aria-atomic="true">
        <div class="rounded-card px-5 py-3 bg-stat-bg border border-border-default flex-shrink-0">
          <span class="text-sm block text-text-muted">Videos scanned</span>
          <p class="text-2xl font-bold text-text-primary">{{ props.videos.length }}</p>
        </div>
        <div v-if="linkResults.length > 0"
          class="rounded-card px-5 py-3 bg-error-bg border border-error-border flex-shrink-0">
          <span class="text-sm block text-error-text/80">Dead</span>
          <p class="text-2xl font-bold text-error-text">{{ deadLinksCount }}</p>
        </div>
        <div v-if="linkResults.length > 0" class="rounded-card px-5 py-3 bg-alert-bg border border-alert-border">
          <span class="text-sm block text-alert-text-muted">Redirected</span>
          <p class="text-2xl font-bold text-alert-text">{{ redirectedLinksCount }}</p>
        </div>
        <div v-if="linkResults.length > 0"
          class="rounded-card px-5 py-3 bg-stat-bg border border-border-default flex-shrink-0">
          <span class="text-sm block text-text-muted">OK</span>
          <p class="text-2xl font-bold text-merch-link">{{ okLinksCount }}</p>
        </div>
        <div v-if="codeIssuesCount > 0"
          class="rounded-card px-5 py-3 bg-alert-bg border border-alert-border flex-shrink-0">
          <span class="text-sm block text-alert-text-muted">Code issues</span>
          <p class="text-2xl font-bold text-alert-text">{{ codeIssuesCount }}</p>
        </div>
      </div>

      <!-- Filters: grouped by purpose -->
      <div class="rounded-card p-4 bg-filter-bg border border-border-default space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-text-muted w-full sm:w-auto">Link type:</span>
          <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="filterSponsor ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
            @click="filterSponsor = !filterSponsor">
            Sponsor
          </button>
          <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="filterAffiliate ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
            @click="filterAffiliate = !filterAffiliate">
            Affiliate
          </button>
          <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="filterMerch ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
            @click="filterMerch = !filterMerch">
            Merch
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-text-muted w-full sm:w-auto">Video type:</span>
          <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="filterType === 'short' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
            @click="filterType = filterType === 'short' ? null : 'short'">
            Short
          </button>
          <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="filterType === 'live' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
            @click="filterType = filterType === 'live' ? null : 'live'">
            Live
          </button>
          <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="filterType === 'video' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
            @click="filterType = filterType === 'video' ? null : 'video'">
            Video
          </button>
          <button type="button" class="filter-btn px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="filterPaidPlacement ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-filter-border text-filter-text hover:bg-filter-bg-hover'"
            @click="filterPaidPlacement = !filterPaidPlacement">
            Paid placement
          </button>
        </div>
      </div>

      <!-- My sponsors -->
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
      </div>

      <div v-if="allLinksCount > 0" class="flex flex-col gap-3">
        <div v-if="isCheckingLinks" class="rounded-card p-4 bg-card-bg border border-border-default">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full border-2 border-border-default border-t-btn-from animate-spin flex-shrink-0" />
            <div class="min-w-0">
              <p class="font-medium text-text-primary">Checking links</p>
              <p class="text-sm text-text-muted">{{ linkCheckProgress }}</p>
            </div>
          </div>
          <div class="mt-3 h-1.5 rounded-full bg-border-default overflow-hidden">
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
            @click="exportCsv">
            Export CSV
          </button>
          <button v-if="linkResults.length > 0" type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all"
            @click="exportJson">
            Export JSON
          </button>
          <button type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention hover:border-border-attention transition-all"
            @click="clearCache">
            Clear cache
          </button>
        </div>
        <div v-if="linkCheckError"
          class="rounded-card px-4 py-3 flex items-center justify-between gap-3 bg-error-bg border border-error-border text-error-text">
          <span>{{ linkCheckError }}</span>
          <button type="button" class="px-3 py-1 rounded-button text-sm font-medium bg-error-bg hover:opacity-90"
            @click="retryLinkCheckWithParse">
            Retry
          </button>
        </div>
      </div>

      <div class="space-y-4" role="list" aria-label="Videos">
        <div v-for="video in paginatedVideos" :key="video.id"
          :ref="(el) => { if (video.id === props.highlightVideoId) highlightRef = el as HTMLElement }"
          :class="video.id === props.highlightVideoId ? 'ring-2 ring-alert-border rounded-card -m-0.5 p-0.5' : ''">
          <VideoCard :video="video" :has-monetization-links="hasMonetizationLinks(video.links)"
            :is-user-sponsor-link="isUserSponsorLink" :has-code-issue="hasCodeIssue" :link-class="linkClass" />
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
import type { Ref } from 'vue'
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'
import type { VideoDetails, VideoType } from '~~/types/youtube'
import type { CategorizedLinks } from '~~/utils/url'
import type { LinkCheckResult } from '~~/types/links'
import { getLinksToCheck } from '~~/utils/url'
import { useLinkCheck } from '~~/composables/useLinkCheck'
import { getRevenueLossForLink } from '~~/utils/revenue'

const props = withDefaults(
  defineProps<{
    videos: VideoDetails[]
    syncLinkResultsToStore?: boolean
    linkResultsRef?: Ref<LinkCheckResult[]>
    highlightVideoId?: string
  }>(),
  { syncLinkResultsToStore: false }
)

const PAGE_SIZE = 10

const deadLinksOpen = ref(true)
const redirectedOpen = ref(false)
const codeIssuesOpen = ref(false)
const filterSponsor = ref(false)
const filterAffiliate = ref(false)
const filterMerch = ref(false)
const filterType = ref<VideoType | null>(null)
const filterPaidPlacement = ref(false)
const filterMySponsors = ref(false)
const userSponsorsInput = ref('')
const userSponsors = ref<string[]>([])
const checkOnlyMySponsors = ref(false)
const currentPage = ref(1)
const highlightRef = ref<HTMLElement | null>(null)
const replacementUrls = ref<Record<string, string>>({})

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

watch([filterSponsor, filterAffiliate, filterMerch, filterType, filterPaidPlacement, filterMySponsors], () => {
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
