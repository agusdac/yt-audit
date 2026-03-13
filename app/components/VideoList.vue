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

    <div v-if="deadLinks.length > 0"
      class="rounded-card flex items-start gap-4 px-5 py-4 bg-error-bg border-2 border-error-border">
      <span class="text-4xl">🔗</span>
      <div>
        <p class="font-bold text-lg text-error-text">
          {{ deadLinks.length }} dead link{{ deadLinks.length > 1 ? 's' : '' }} found
        </p>
        <p class="text-sm mt-1 text-error-text/80">
          These URLs return 404 or 5xx errors. Update or remove them from your video descriptions.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-4">
      <div class="rounded-card px-5 py-3 bg-stat-bg border border-border-default">
        <span class="text-sm block text-text-muted">Videos scanned</span>
        <p class="text-2xl font-bold text-text-primary">{{ videos.length }}</p>
      </div>
      <div v-if="needsAttentionCount > 0"
        class="rounded-card px-5 py-3 bg-stat-attention-bg border border-stat-attention-border">
        <span class="text-sm block text-stat-attention-label">Need your attention</span>
        <p class="text-2xl font-bold text-stat-attention-text">{{ needsAttentionCount }}</p>
      </div>
      <div v-if="deadLinks.length > 0" class="rounded-card px-5 py-3 bg-error-bg border border-error-border">
        <span class="text-sm block text-error-text/80">Dead links</span>
        <p class="text-2xl font-bold text-error-text">{{ deadLinks.length }}</p>
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

    <div v-if="allLinksCount > 0" class="flex items-center gap-3">
      <button type="button"
        class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention hover:border-border-attention transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isCheckingLinks" @click="runLinkCheck">
        {{ isCheckingLinks ? 'Checking...' : `Check ${allLinksCount} links` }}
      </button>
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
            <div class="flex items-center gap-2 mb-1">
              <span v-if="video.type !== 'video'" class="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase"
                :class="video.type === 'short' ? 'bg-sponsor-bg text-sponsor-text border border-sponsor-border' : 'bg-affiliate-bg text-affiliate-text border border-affiliate-border'">
                {{ video.type }}
              </span>
              <span v-if="video.hasPaidProductPlacement"
                class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-merch-bg text-merch-text border border-merch-border">
                Paid
              </span>
            </div>
            <a :href="`https://youtube.com/watch?v=${video.id}`" target="_blank" rel="noopener noreferrer"
              class="font-semibold line-clamp-2 transition-colors block text-text-primary hover:text-hover-link">
              {{ video.title }}
            </a>
            <div class="flex flex-wrap gap-3 mt-2 text-sm text-text-muted">
              <span>{{ formatViews(video.viewCount) }} views</span>
              <span>{{ formatDate(video.publishedAt) }}</span>
            </div>

            <div class="mt-3 space-y-2">
              <div v-if="video.links.sponsors.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sponsor-bg text-sponsor-text border border-sponsor-border">SPONSOR</span>
                <a v-for="url in video.links.sponsors" :key="url" :href="url" target="_blank" rel="noopener noreferrer"
                  :class="['text-sm hover:underline truncate max-w-[200px]', isDeadLink(url) ? 'text-error-text line-through' : 'text-sponsor-link']">
                  {{ url }}
                </a>
              </div>

              <div v-if="video.links.affiliates.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-affiliate-bg text-affiliate-text border border-affiliate-border">AFFILIATE</span>
                <a v-for="url in video.links.affiliates" :key="url" :href="url" target="_blank"
                  rel="noopener noreferrer"
                  :class="['text-sm hover:underline truncate max-w-[200px]', isDeadLink(url) ? 'text-error-text line-through' : 'text-affiliate-link']">
                  {{ url }}
                </a>
              </div>

              <div v-if="video.links.merch.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-merch-bg text-merch-text border border-merch-border">MERCH</span>
                <a v-for="url in video.links.merch" :key="url" :href="url" target="_blank" rel="noopener noreferrer"
                  :class="['text-sm hover:underline truncate max-w-[200px]', isDeadLink(url) ? 'text-error-text line-through' : 'text-merch-link']">
                  {{ url }}
                </a>
              </div>

              <div v-if="video.links.other.length > 0" class="flex flex-wrap gap-2 items-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-other-bg text-other-text border border-other-border">OTHER</span>
                <a v-for="url in video.links.other" :key="url" :href="url" target="_blank" rel="noopener noreferrer"
                  :class="['text-sm hover:underline truncate max-w-[200px]', isDeadLink(url) ? 'text-error-text line-through' : 'text-other-link']">
                  {{ url }}
                </a>
              </div>

              <div v-if="!hasMonetizationLinks(video.links)" class="text-sm text-text-muted-strong">
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

const props = defineProps<{
  videos: VideoDetails[]
}>()

const videos = ref<VideoDetails[]>(props.videos)

const PAGE_SIZE = 10

const filterSponsor = ref(false)
const filterAffiliate = ref(false)
const filterMerch = ref(false)
const filterType = ref<VideoType | null>(null)
const filterPaidPlacement = ref(false)
const currentPage = ref(1)
const deadLinks = ref<Array<{ url: string; status: number; videoIds: string[] }>>([])
const isCheckingLinks = ref(false)

const getAllLinks = (links: CategorizedLinks): string[] => [
  ...links.sponsors,
  ...links.affiliates,
  ...links.merch,
  ...links.other,
  ...links.socials
]

const allLinksCount = computed(() => {
  const seen = new Set<string>()
  videos.value.forEach(v => {
    getAllLinks(v.links).forEach(url => seen.add(url))
  })
  return seen.size
})

const hasMonetizationLinks = (links: CategorizedLinks): boolean => {
  const { sponsors, affiliates, merch } = links
  return sponsors.length > 0 || affiliates.length > 0 || merch.length > 0
}

const isDeadLink = (url: string): boolean =>
  deadLinks.value.some(d => d.url === url)

const matchesLinkFilter = (video: VideoDetails): boolean => {
  if (!filterSponsor.value && !filterAffiliate.value && !filterMerch.value) return true
  const { sponsors, affiliates, merch } = video.links
  if (filterSponsor.value && sponsors.length > 0) return true
  if (filterAffiliate.value && affiliates.length > 0) return true
  if (filterMerch.value && merch.length > 0) return true
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

const filteredVideos = computed(() =>
  videos.value.filter(v =>
    matchesLinkFilter(v) && matchesTypeFilter(v) && matchesPaidPlacementFilter(v)
  )
)

watch([filterSponsor, filterAffiliate, filterMerch, filterType, filterPaidPlacement], () => {
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

const runLinkCheck = async () => {
  isCheckingLinks.value = true
  deadLinks.value = []

  const checks: Array<{ url: string; videoIds: string[] }> = []
  const urlToVideoIds = new Map<string, string[]>()

  videos.value.forEach(video => {
    getAllLinks(video.links).forEach(url => {
      const existing = urlToVideoIds.get(url) ?? []
      if (!existing.includes(video.id)) {
        existing.push(video.id)
        urlToVideoIds.set(url, existing)
      }
    })
  })

  urlToVideoIds.forEach((videoIds, url) => {
    checks.push({ url, videoIds })
  })

  try {
    const res = await $fetch<{ deadLinks: Array<{ url: string; status: number; videoIds: string[] }> }>(
      '/api/check-links',
      {
        method: 'POST',
        body: { checks }
      }
    )
    deadLinks.value = res.deadLinks
  } catch {
    deadLinks.value = []
  } finally {
    isCheckingLinks.value = false
  }
}

const formatViews = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
</script>
