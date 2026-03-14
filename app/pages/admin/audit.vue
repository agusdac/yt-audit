<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <div class="rounded-card p-6 bg-card-bg border border-border-default mb-6">
        <h2 class="font-semibold text-text-primary mb-4">Audit any channel</h2>
        <div class="flex flex-wrap gap-2 p-3 rounded-card bg-filter-bg border border-border-default mb-4">
          <span
            v-for="handle in channelHandles"
            :key="handle"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary"
          >
            @{{ handle }}
            <button type="button" class="hover:text-error-text transition-colors -mr-0.5" aria-label="Remove" @click="removeChannel(handle)">
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
        <button
          type="button"
          class="px-6 py-3 rounded-button font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to"
          :disabled="isLoading || channelHandles.length === 0"
          @click="runAudit"
        >
          {{ isLoading ? 'Auditing...' : 'Run Audit' }}
        </button>
      </div>

      <div v-if="error" class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
        <span class="text-2xl">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <div v-if="isLoading" class="mb-6">
        <p class="text-text-muted mb-4">Fetching videos...</p>
        <AuditSkeleton />
      </div>

      <div v-else-if="videoDetails.length > 0" class="mb-6">
        <ErrorBoundary>
          <VideoList :videos="videoDetails" />
        </ErrorBoundary>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VideoDetails } from '~~/types/youtube'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const channelHandles = ref<string[]>([])
const channelInput = ref('')
const channelInputRef = ref<HTMLInputElement | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const videoDetails = ref<VideoDetails[]>([])

const normalizeHandle = (h: string): string => h.trim().replace(/^@/, '')

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
    error.value = err?.data?.message ?? err?.message ?? 'Failed to run audit.'
  } finally {
    isLoading.value = false
  }
}
</script>
