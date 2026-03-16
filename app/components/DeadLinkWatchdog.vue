<template>
  <div v-if="items.length > 0" class="rounded-card bg-error-bg/20 border border-error-border overflow-hidden">
    <button
      type="button"
      class="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-filter-bg transition-colors"
      @click="sectionOpen = !sectionOpen"
    >
      <h3 class="font-bold text-lg text-error-text">Dead links — fix these first</h3>
      <span class="text-sm text-error-text/80">{{ items.length }} link{{ items.length > 1 ? 's' : '' }}</span>
      <span class="text-error-text text-xl transition-transform" :class="sectionOpen ? 'rotate-180' : ''">▼</span>
    </button>
    <div v-show="sectionOpen" class="p-6 pt-0 max-h-[320px] overflow-y-auto scroll-area">
    <div class="space-y-4">
    <div v-for="item in items" :key="item.url" class="rounded-lg p-4 bg-card-bg border border-error-border space-y-3 relative">
      <NuxtLink
        v-if="item.firstVideoId && props.viewVideosHref"
        :to="`${props.viewVideosHref}?videoId=${item.firstVideoId}`"
        class="absolute top-3 right-3 text-xs text-text-muted hover:text-hover-link truncate max-w-[120px] block text-right"
        :title="item.firstVideoTitle || 'View video'"
      >
        {{ item.firstVideoTitle || 'View video' }}
      </NuxtLink>
      <p class="text-sm text-error-text line-through break-all font-mono pr-24">{{ item.url }}</p>
      <p class="text-sm text-text-muted">
        {{ item.videoIds.length }} video{{ item.videoIds.length > 1 ? 's' : '' }} affected
        · ~${{ Math.round(item.revenueLoss) }}/month estimated loss
      </p>
      <div class="flex flex-wrap gap-2 items-center">
        <a
          v-if="item.firstVideoId"
          :href="studioUrl(item.firstVideoId)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold bg-error-bg border-2 border-error-border text-error-text hover:opacity-90 hover:border-error-text transition-all"
        >
          Fix in YouTube Studio
        </a>
        <button
          v-if="item.firstVideoId"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
          @click="copyStudioLink(item)"
        >
          {{ copiedVideoId === item.firstVideoId ? 'Copied!' : 'Copy link' }}
        </button>
      </div>
    </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    items: Array<{ url: string; videoIds: string[]; revenueLoss: number; firstVideoId?: string; firstVideoTitle?: string }>
    maxVisible?: number
    viewVideosHref?: string
  }>(),
  { maxVisible: undefined, viewVideosHref: '/videos' }
)


const sectionOpen = ref(true)
const copiedVideoId = ref<string | null>(null)
let copyFeedbackTimeout: ReturnType<typeof setTimeout> | null = null

const studioUrl = (videoId: string) => `https://studio.youtube.com/video/${videoId}/edit`

const copyStudioLink = async (item: { firstVideoId?: string }) => {
  const videoId = item.firstVideoId
  if (!videoId) return
  const url = studioUrl(videoId)
  await navigator.clipboard.writeText(url)
  copiedVideoId.value = videoId
  if (copyFeedbackTimeout) clearTimeout(copyFeedbackTimeout)
  copyFeedbackTimeout = setTimeout(() => {
    copiedVideoId.value = null
    copyFeedbackTimeout = null
  }, 2000)
}
</script>
