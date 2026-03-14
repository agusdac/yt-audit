<template>
  <div v-if="items.length > 0" class="rounded-card p-6 bg-error-bg/40 border-2 border-error-border space-y-4">
    <h3 class="font-bold text-lg text-error-text">Dead links — fix these first</h3>
    <div v-for="item in items" :key="item.url" class="rounded-lg p-4 bg-card-bg border border-error-border space-y-3">
      <p class="text-sm text-error-text line-through break-all font-mono">{{ item.url }}</p>
      <p class="text-sm text-text-muted">
        {{ item.videoIds.length }} video{{ item.videoIds.length > 1 ? 's' : '' }} affected
        · ~${{ Math.round(item.revenueLoss) }}/month estimated loss
      </p>
      <div class="flex flex-wrap gap-2">
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
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: Array<{ url: string; videoIds: string[]; revenueLoss: number; firstVideoId?: string }>
}>()

const studioUrl = (videoId: string) => `https://studio.youtube.com/video/${videoId}/edit`

const copyStudioLink = async (videoId: string) => {
  const url = studioUrl(videoId)
  await navigator.clipboard.writeText(url)
  // Could add toast feedback
}
</script>
