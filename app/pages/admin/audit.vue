<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <div class="rounded-card p-6 bg-card-bg border border-border-default mb-6">
        <h2 class="font-semibold text-text-primary mb-4">Audit any channel</h2>
        <div class="flex flex-wrap gap-2 p-3 rounded-card bg-filter-bg border border-border-default mb-4">
          <span
            v-for="handle in store.channelHandles"
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
          :disabled="store.isLoading || store.isCheckingLinks || store.channelHandles.length === 0"
          @click="runAudit"
        >
          {{ store.isLoading ? 'Running audit...' : store.isCheckingLinks ? 'Checking links...' : 'Run Audit' }}
        </button>
      </div>

      <div v-if="store.error" class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
        <span class="text-2xl">⚠️</span>
        <span>{{ store.error }}</span>
        <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
      </div>

      <div v-if="store.isLoading || store.isCheckingLinks" class="mb-6">
        <p class="text-text-muted mb-2 font-medium">
          {{ store.isCheckingLinks ? 'Checking links...' : 'Running audit...' }}
        </p>
        <p class="text-text-muted text-sm mb-4">
          This can take several minutes for channels with many videos.
        </p>
        <ul class="text-sm text-text-muted/80 space-y-1 mb-4 list-disc list-inside">
          <li>Fetching videos from YouTube</li>
          <li>Checking links</li>
          <li>Fetching comments</li>
        </ul>
        <div class="h-1 rounded-full bg-border-default overflow-hidden mb-4">
          <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/3" />
        </div>
        <AuditSkeleton />
      </div>

      <div v-else-if="store.videos.length > 0" class="mb-6">
        <ErrorBoundary>
          <VideoList
          :videos="store.videos"
          :link-results-ref="storeToRefs(store).linkResults"
          :highlight-video-id="route.query.videoId as string | undefined"
        />
        </ErrorBoundary>
      </div>

      <div v-else class="rounded-card p-8 bg-card-bg border border-border-default text-center">
        <p class="text-text-muted mb-4">Add channel handles above and run an audit to see videos and check links.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminAuditStore } from '~~/stores/adminAuditStore'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const store = useAdminAuditStore()
const channelInput = ref('')
const channelInputRef = ref<HTMLInputElement | null>(null)

const normalizeHandle = (h: string): string => h.trim().replace(/^@/, '')

const addChannel = () => {
  const h = normalizeHandle(channelInput.value)
  if (h && !store.channelHandles.includes(h)) {
    store.setChannelHandles([...store.channelHandles, h])
    channelInput.value = ''
    channelInputRef.value?.focus()
  }
}

const removeChannel = (handle: string) => {
  store.setChannelHandles(store.channelHandles.filter((h) => h !== handle))
}

const runAudit = async () => {
  addChannel()
  if (store.channelHandles.length === 0) return
  await store.runAudit(store.channelHandles)
}

const route = useRoute()
</script>
