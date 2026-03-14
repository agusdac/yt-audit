<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary">
    <header class="relative overflow-hidden border-b border-border-default">
      <div class="absolute inset-0 bg-gradient-to-br from-hero-from via-transparent to-hero-to" />
      <div class="relative max-w-4xl mx-auto px-6 py-12">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold tracking-tight mb-1">
              <span class="bg-gradient-to-r from-title-from via-title-via to-title-to bg-clip-text text-transparent">
                Link Audit
              </span>
            </h1>
            <p class="text-text-muted">Audit your linked YouTube channels</p>
          </div>
          <div class="flex items-center gap-3">
            <div v-if="me?.user" class="flex items-center gap-2">
              <img v-if="me.user.avatarUrl" :src="me.user.avatarUrl" :alt="me.user.name ?? ''" class="w-8 h-8 rounded-full" />
              <span class="text-sm text-text-muted">{{ me.user.name ?? me.user.email }}</span>
            </div>
            <button
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
              @click="logout"
            >
              Logout
            </button>
          </div>
        </div>

        <div v-if="me?.linkedChannels?.length" class="mt-6">
          <p class="text-sm text-text-muted mb-2">Your channels</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="ch in me.linkedChannels"
              :key="ch.id"
              class="inline-flex items-center px-3 py-1.5 rounded-button text-sm bg-filter-bg border border-filter-border text-filter-text-active"
            >
              @{{ ch.handle }}
            </span>
          </div>
          <button
            type="button"
            class="mt-4 px-6 py-3 rounded-button font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to hover:scale-[1.02] active:scale-[0.98]"
            :disabled="isLoading || !me.linkedChannels.length"
            @click="runAudit"
          >
            {{ isLoading ? 'Auditing...' : 'Run Audit' }}
          </button>
        </div>
        <div v-else class="mt-6 rounded-card p-6 bg-card-bg border border-border-default">
          <p class="text-text-muted">No YouTube channels linked. Sign in with a Google account that has a YouTube channel.</p>
        </div>
      </div>
    </header>

    <div v-if="error" class="max-w-4xl mx-auto px-6 py-4">
      <div class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text">
        <span class="text-2xl">⚠️</span>
        <span>{{ error }}</span>
      </div>
    </div>

    <div v-if="isLoading" class="max-w-4xl mx-auto px-6 py-6">
      <p class="text-text-muted mb-4">Fetching videos...</p>
      <AuditSkeleton />
    </div>

    <div v-else-if="videoDetails.length > 0" class="max-w-4xl mx-auto px-6 py-6">
      <ErrorBoundary>
        <VideoList :videos="videoDetails" />
      </ErrorBoundary>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VideoDetails } from '~~/types/youtube'

definePageMeta({
  middleware: 'auth'
})

const { data: me } = await useFetch<{ user: { id: string; email: string; name?: string; avatarUrl?: string }; linkedChannels: Array<{ id: number; channelId: string; handle: string; channelTitle?: string }> }>('/api/auth/me')

const isLoading = ref(false)
const error = ref<string | null>(null)
const videoDetails = ref<VideoDetails[]>([])

const runAudit = async () => {
  const channels = me.value?.linkedChannels
  if (!channels?.length) return

  isLoading.value = true
  error.value = null
  videoDetails.value = []

  try {
    const response = await $fetch<{ count: number; videos: VideoDetails[] }>('/api/audit', {
      method: 'POST',
      body: { handles: channels.map(c => c.handle) }
    })
    videoDetails.value = response.videos
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    error.value = err?.data?.message ?? err?.message ?? 'Failed to run audit.'
  } finally {
    isLoading.value = false
  }
}

const logout = async () => {
  const { clear } = useUserSession()
  await clear()
  await navigateTo('/')
}
</script>
