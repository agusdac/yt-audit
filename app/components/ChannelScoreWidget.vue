<template>
  <div class="rounded-card bg-card-bg border border-border-default overflow-hidden">
    <div class="px-4 py-3 border-b border-border-default flex items-center justify-between">
      <div>
        <h3 class="font-bold text-text-primary">Channel Score</h3>
        <p class="text-xs text-text-muted mt-0.5">Metadata only—channel setup + recent videos</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button"
          class="flex-shrink-0 p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-card-bg-attention"
          title="Refresh score" :disabled="loading" @click="fetchScore(true)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <NuxtLink :to="detailHref"
          class="flex-shrink-0 px-3 py-1.5 ml-2 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention">
          View details
        </NuxtLink>
      </div>
    </div>
    <div class="p-4">
      <div v-if="loading" class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-full bg-border-default animate-pulse" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-20 rounded bg-border-default animate-pulse" />
          <div class="h-3 w-32 rounded bg-border-default animate-pulse" />
        </div>
      </div>
      <div v-else-if="error" class="text-sm text-error-text">
        {{ error }}
      </div>
      <div v-else-if="channelScore" class="flex items-center gap-4">
        <div class="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2"
          :class="scoreColorClass">
          {{ channelScore.score }}
        </div>
        <div>
          <p class="text-2xl font-bold text-text-primary">{{ channelScore.score }}/100</p>
          <p class="text-xs text-text-muted">
            Setup {{ channelScore.setupScore }}/100 · Recent {{ channelScore.recentContentScore }}/100
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChannelScoreResult } from '~~/utils/channelScore'

const props = withDefaults(
  defineProps<{
    channelHandle?: string
    detailHref?: string
  }>(),
  { detailHref: '/channel-score' }
)

const loading = ref(true)
const error = ref<string | null>(null)
const channelScore = ref<ChannelScoreResult | null>(null)

const scoreColorClass = computed(() => {
  const s = channelScore.value?.score ?? 0
  if (s >= 80) return 'bg-merch-bg/30 border-merch-border text-merch-text'
  if (s >= 60) return 'bg-affiliate-bg/30 border-affiliate-border text-affiliate-text'
  if (s >= 40) return 'bg-alert-bg/30 border-alert-border text-alert-text'
  return 'bg-error-bg/30 border-error-border text-error-text'
})

const fetchScore = async (forceRefresh = false) => {
  loading.value = true
  error.value = null
  try {
    const base = props.channelHandle
      ? `/api/channel-score?handle=${encodeURIComponent(props.channelHandle)}`
      : '/api/channel-score'
    const url = forceRefresh ? `${base}${base.includes('?') ? '&' : '?'}refresh=1` : base
    const res = await $fetch<{ channelScore: ChannelScoreResult }>(url)
    channelScore.value = res.channelScore
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message ?? 'Failed to load channel score'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.channelHandle,
  () => fetchScore(),
  { immediate: true }
)
</script>
