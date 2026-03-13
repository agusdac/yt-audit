<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary">
    <header class="relative overflow-hidden border-b border-border-default">
      <div class="absolute inset-0 bg-gradient-to-br from-hero-from via-transparent to-hero-to" />
      <div class="relative max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          <span class="bg-gradient-to-r from-title-from via-title-via to-title-to bg-clip-text text-transparent">
            Link Audit
          </span>
        </h1>
        <p class="text-lg max-w-xl mx-auto mb-8 text-text-muted">
          Find dead links, expired sponsor codes, and outdated affiliates in your top videos—before your audience does.
        </p>

        <div class="max-w-xl mx-auto">
          <input
            v-model="channelHandle"
            type="text"
            placeholder="Channel handle (e.g. @ludwig)"
            class="w-full px-4 py-3 rounded-card bg-card-bg border border-border-default focus:border-border-attention focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>

        <button
          type="button"
          class="mt-6 px-8 py-4 rounded-button font-semibold text-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to hover:scale-[1.02] active:scale-[0.98]"
          :disabled="isLoading || !channelHandle.trim()"
          @click="runAudit"
        >
          {{ isLoading ? 'Auditing...' : 'Run Audit' }}
        </button>
      </div>
    </header>

    <div v-if="error" class="max-w-4xl mx-auto px-6 py-4">
      <div class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text">
        <span class="text-2xl">⚠️</span>
        <span>{{ error }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 gap-4">
      <div
        class="w-12 h-12 rounded-full border-4 border-border-default border-t-btn-from animate-spin"
        role="status"
        aria-label="Loading"
      />
      <p class="text-text-muted">Fetching videos...</p>
    </div>

    <div v-else-if="videoDetails.length > 0" class="max-w-4xl mx-auto px-6 py-6">
      <VideoList :videos="videoDetails" />
    </div>

    <div v-else-if="!error" class="max-w-xl mx-auto px-6 py-20 text-center">
      <p class="text-lg text-text-muted">
        Enter a channel handle above and click <strong class="text-text-primary">Run Audit</strong> to scan their videos.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VideoDetails } from '~~/types/youtube'

const isLoading = ref(false)
const error = ref<string | null>(null)
const videoDetails = ref<VideoDetails[]>([])
const channelHandle = ref('')

const normalizeHandle = (h: string): string =>
  h.trim().replace(/^@/, '')

const runAudit = async () => {
  const handle = normalizeHandle(channelHandle.value)
  if (!handle) return

  isLoading.value = true
  error.value = null
  videoDetails.value = []

  try {
    const response = await $fetch<{ count: number; videos: VideoDetails[] }>('/api/audit', {
      method: 'POST',
      body: { handles: [handle] }
    })

    videoDetails.value = response.videos
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    error.value = err?.data?.message ?? err?.message ?? 'Failed to run audit. Check your API key.'
  } finally {
    isLoading.value = false
  }
}
</script>
