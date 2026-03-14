<template>
  <div v-if="items.length > 0" class="rounded-card p-6 bg-error-bg/40 border-2 border-error-border space-y-4">
    <h3 class="font-bold text-lg text-error-text">Dead links — fix these first</h3>
    <div v-for="item in visibleItems" :key="item.url" class="rounded-lg p-4 bg-card-bg border border-error-border space-y-3">
      <p class="text-sm text-error-text line-through break-all font-mono">{{ item.url }}</p>
      <p class="text-sm text-text-muted">
        {{ item.videoIds.length }} video{{ item.videoIds.length > 1 ? 's' : '' }} affected
        · ~${{ Math.round(item.revenueLoss) }}/month estimated loss
      </p>
      <div class="flex flex-wrap gap-2 items-center">
        <NuxtLink
          v-if="item.firstVideoId && props.viewVideosHref"
          :to="`${props.viewVideosHref}?videoId=${item.firstVideoId}`"
          class="text-xs text-text-muted hover:text-hover-link underline truncate max-w-[180px]"
        >
          {{ item.firstVideoTitle || 'View video' }}
        </NuxtLink>
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
          @click="copyStudioLink(item.firstVideoId)"
        >
          Copy link
        </button>
      </div>
    </div>
    <button
      v-if="hasMore && !expanded"
      type="button"
      class="w-full py-2 text-sm font-medium text-error-text hover:text-error-text/80 border border-error-border rounded-button hover:bg-error-bg/30 transition-colors"
      @click="expanded = true"
    >
      Show all {{ items.length }} links
    </button>
    <button
      v-else-if="hasMore && expanded"
      type="button"
      class="w-full py-2 text-sm font-medium text-text-muted hover:text-text-primary border border-border-default rounded-button hover:bg-card-bg-attention transition-colors"
      @click="expanded = false"
    >
      Show less
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    items: Array<{ url: string; videoIds: string[]; revenueLoss: number; firstVideoId?: string; firstVideoTitle?: string }>
    maxVisible?: number
    viewVideosHref?: string
  }>(),
  { maxVisible: undefined, viewVideosHref: '/videos' }
)


const expanded = ref(false)

const hasMore = computed(
  () => props.maxVisible != null && props.items.length > props.maxVisible
)

const visibleItems = computed(() => {
  if (props.maxVisible == null || expanded.value || !hasMore.value) {
    return props.items
  }
  return props.items.slice(0, props.maxVisible)
})

const studioUrl = (videoId: string) => `https://studio.youtube.com/video/${videoId}/edit`

const copyStudioLink = async (videoId: string) => {
  const url = studioUrl(videoId)
  await navigator.clipboard.writeText(url)
  // Could add toast feedback
}
</script>
