<template>
  <div class="rounded-card bg-card-bg border border-border-default overflow-hidden">
    <div class="px-4 py-3 border-b border-border-default flex items-center justify-between">
      <div>
        <h3 class="font-bold text-text-primary">Channel Score</h3>
        <p class="text-xs text-text-muted mt-0.5">Metadata only—channel setup + recent videos</p>
      </div>
      <NuxtLink :to="detailHref"
        class="flex-shrink-0 px-3 ml-2 py-1.5 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention">
        View details
      </NuxtLink>
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

const fetchScore = async () => {
  loading.value = true
  error.value = null
  try {
    const url = props.channelHandle
      ? `/api/channel-score?handle=${encodeURIComponent(props.channelHandle)}`
      : '/api/channel-score'
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
