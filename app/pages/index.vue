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
          <div
            class="flex flex-wrap gap-2 p-3 rounded-card bg-card-bg border border-border-default focus-within:border-border-attention transition-colors"
          >
            <span
              v-for="handle in channelHandles"
              :key="handle"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm bg-filter-bg border border-filter-border text-filter-text-active"
            >
              @{{ handle }}
              <button
                type="button"
                class="hover:text-error-text transition-colors -mr-0.5"
                aria-label="Remove"
                @click="removeChannel(handle)"
              >
                ×
              </button>
            </span>
            <input
              ref="channelInputRef"
              v-model="channelInput"
              type="text"
              placeholder="Add channel (@handle)"
              class="flex-1 min-w-[140px] px-2 py-1.5 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-sm"
              @keydown.enter.prevent="addChannel"
              @keydown.comma.prevent="addChannel"
            />
          </div>
          <p class="text-xs text-text-muted mt-2">
            Press Enter or comma to add. Add multiple channels to audit them together.
          </p>
        </div>

        <button
          type="button"
          class="mt-6 px-8 py-4 rounded-button font-semibold text-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to hover:scale-[1.02] active:scale-[0.98]"
          :disabled="isLoading || channelHandles.length === 0"
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
      <p class="text-text-muted">Fetching videos from {{ channelHandles.length }} channel{{ channelHandles.length > 1 ? 's' : '' }}...</p>
    </div>

    <div v-else-if="videoDetails.length > 0" class="max-w-4xl mx-auto px-6 py-6">
      <VideoList :videos="videoDetails" />
    </div>

    <div v-else-if="!error" class="max-w-xl mx-auto px-6 py-20 text-center">
      <p class="text-lg text-text-muted">
        Add channel handles above and click <strong class="text-text-primary">Run Audit</strong> to scan their videos.
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
const channelHandles = ref<string[]>([])
const channelInput = ref('')
const channelInputRef = ref<HTMLInputElement | null>(null)

const normalizeHandle = (h: string): string =>
  h.trim().replace(/^@/, '')

const addChannel = () => {
  const h = normalizeHandle(channelInput.value)
  if (h && !channelHandles.value.includes(h)) {
    channelHandles.value = [...channelHandles.value, h]
    channelInput.value = ''
    channelInputRef.value?.focus()
  }
}

const removeChannel = (handle: string) => {
  channelHandles.value = channelHandles.value.filter(h => h !== handle)
}

const runAudit = async () => {
  addChannel()
  if (channelHandles.value.length === 0) return

  isLoading.value = true
  error.value = null
  videoDetails.value = []

  try {
    const response = await $fetch<{ count: number; videos: VideoDetails[] }>('/api/audit', {
      method: 'POST',
      body: { handles: channelHandles.value }
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
