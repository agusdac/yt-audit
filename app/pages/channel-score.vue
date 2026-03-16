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
      <NuxtLink to="/dashboard" class="ml-auto px-3 py-1 rounded-button text-sm bg-card-bg border border-border-default">
        Back to Dashboard
      </NuxtLink>
    </div>

    <template v-else-if="channelScore">
      <div class="mb-6 flex items-center gap-3">
        <NuxtLink to="/dashboard" class="text-sm text-text-muted hover:text-text-primary transition-colors">
          ← Back to Dashboard
        </NuxtLink>
        <span v-if="channelHandle" class="text-sm text-text-muted">@{{ channelHandle }}</span>
      </div>

      <ChannelScoreCard :score="channelScore" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ChannelScoreResult } from '~~/utils/channelScore'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})

const loading = ref(true)
const error = ref<string | null>(null)
const channelScore = ref<ChannelScoreResult | null>(null)
const channelHandle = ref<string | null>(null)

const fetchScore = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<{ channelScore: ChannelScoreResult; channelHandle: string }>('/api/channel-score')
    channelScore.value = res.channelScore
    channelHandle.value = res.channelHandle
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message ?? 'Failed to load channel score'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchScore())
</script>
