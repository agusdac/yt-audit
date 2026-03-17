<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="loading" class="space-y-4">
      <div class="h-48 rounded-card bg-card-bg border border-border-default animate-pulse" />
      <div class="h-8 w-3/4 rounded bg-card-bg animate-pulse" />
      <div class="h-4 w-full rounded bg-card-bg animate-pulse" />
    </div>

    <div v-else-if="error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text">
      <span class="text-2xl">⚠️</span>
      <span>{{ error }}</span>
      <NuxtLink to="/videos" class="ml-auto px-3 py-1 rounded-button text-sm bg-card-bg border border-border-default">
        Back to Videos
      </NuxtLink>
    </div>

    <template v-else-if="data">
      <div class="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <NuxtLink to="/videos" class="text-sm text-text-muted hover:text-text-primary transition-colors">
          ← Back to Videos
        </NuxtLink>
        <button
          type="button"
          class="px-3 py-1.5 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention disabled:opacity-60"
          :disabled="loading"
          @click="fetchVideo(true)">
          Refresh score
        </button>
      </div>

      <div class="space-y-8">
        <div class="rounded-card bg-card-bg border border-border-default overflow-hidden">
          <div class="flex flex-col md:flex-row gap-6 p-6">
            <a :href="`https://youtube.com/watch?v=${data.video.id}`" target="_blank" rel="noopener noreferrer"
              class="flex-shrink-0 w-full md:w-80 rounded-lg overflow-hidden bg-thumb-bg aspect-video">
              <img :src="thumbnailUrl" :alt="data.video.title" class="w-full h-full object-cover"
                @error="thumbnailError = true" />
            </a>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span v-if="data.video.channelHandle"
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-card-bg border border-border-default text-text-muted">
                  @{{ data.video.channelHandle }}
                </span>
                <span v-if="data.video.type !== 'video'"
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase"
                  :class="data.video.type === 'short' ? 'bg-sponsor-bg text-sponsor-text border border-sponsor-border' : 'bg-affiliate-bg text-affiliate-text border border-affiliate-border'">
                  {{ data.video.type }}
                </span>
              </div>
              <h1 class="text-xl font-bold text-text-primary mb-2">{{ data.video.title }}</h1>
              <div class="flex flex-wrap gap-4 text-sm text-text-muted mb-4">
                <span>{{ formatViews(data.video.viewCount) }} views</span>
                <span>{{ formatDate(data.video.publishedAt) }}</span>
                <span>{{ data.video.likeCount }} likes</span>
                <span>{{ data.video.commentCount }} comments</span>
              </div>
              <a :href="`https://studio.youtube.com/video/${data.video.id}/edit`" target="_blank"
                rel="noopener noreferrer"
                class="inline-flex px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention">
                Edit in YouTube Studio
              </a>
            </div>
          </div>
        </div>

        <VideoScoreCard :score="data.score" />

        <div v-if="hasLinks" class="rounded-card bg-card-bg border border-border-default p-6">
          <h3 class="font-bold text-lg text-text-primary mb-4">Links in description</h3>
          <div class="space-y-4">
            <LinksSection v-if="data.video.links.sponsors.length" label="Sponsor" :urls="data.video.links.sponsors"
              :link-results="data.linkResults" :video-id="data.video.id" />
            <LinksSection v-if="data.video.links.affiliates.length" label="Affiliate"
              :urls="data.video.links.affiliates" :link-results="data.linkResults" :video-id="data.video.id" />
            <LinksSection v-if="data.video.links.merch.length" label="Merch" :urls="data.video.links.merch"
              :link-results="data.linkResults" :video-id="data.video.id" />
            <LinksSection v-if="data.video.links.socialWithRevenue.length" label="Support"
              :urls="data.video.links.socialWithRevenue" :link-results="data.linkResults" :video-id="data.video.id" />
            <LinksSection v-if="data.video.links.other.length" label="Other" :urls="data.video.links.other"
              :link-results="data.linkResults" :video-id="data.video.id" />
          </div>
        </div>

        <div class="rounded-card bg-card-bg border border-border-default p-6">
          <h3 class="font-bold text-lg text-text-primary mb-4">Description</h3>
          <div class="text-sm text-text-muted whitespace-pre-wrap font-mono max-h-96 overflow-y-auto scroll-area">
            {{ data.video.description || 'No description' }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import type { VideoScoreResult } from '~~/utils/videoScore'
import { formatViews, formatDate } from '~~/utils/format'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})

const route = useRoute()
const videoId = route.params.videoId as string

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<{
  video: VideoDetails
  linkResults: LinkCheckResult[]
  score: VideoScoreResult
} | null>(null)
const thumbnailError = ref(false)

const thumbnailUrl = computed(() => {
  if (thumbnailError.value || !data.value?.video?.thumbnails?.maxres) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  }
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
})

const hasLinks = computed(() => {
  if (!data.value?.video?.links) return false
  const l = data.value.video.links
  return l.sponsors.length + l.affiliates.length + l.merch.length + l.socialWithRevenue.length + l.other.length > 0
})

const fetchVideo = async (forceRefresh = false) => {
  loading.value = true
  error.value = null
  try {
    const url = forceRefresh ? `/api/video/${videoId}?refresh=1` : `/api/video/${videoId}`
    const res = await $fetch<{ video: VideoDetails; linkResults: LinkCheckResult[]; score: VideoScoreResult }>(url)
    data.value = res
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusCode?: number }
    error.value = err?.data?.message ?? (err?.statusCode === 404 ? 'Video not found' : 'Failed to load video')
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchVideo())
watch(
  () => route.params.videoId,
  (newId) => {
    thumbnailError.value = false
    if (newId) fetchVideo()
  },
  { immediate: false }
)

const pageTitle = computed(() =>
  data.value?.video?.title ? `${data.value.video.title} | UpScrub` : 'Video | UpScrub'
)
useSeoMeta({ title: pageTitle })
</script>
