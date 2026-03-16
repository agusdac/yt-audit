<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="!handleParam" class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text">
      <span class="text-2xl">⚠️</span>
      <span>Channel handle required. Run an audit first or add a channel.</span>
      <NuxtLink to="/admin/dashboard" class="ml-auto px-3 py-1 rounded-button text-sm bg-card-bg border border-border-default">
        Back to Dashboard
      </NuxtLink>
    </div>

    <template v-else>
      <div v-if="loading" class="space-y-4">
        <div class="h-48 rounded-card bg-card-bg border border-border-default animate-pulse" />
        <div class="h-8 w-3/4 rounded bg-card-bg animate-pulse" />
        <div class="h-4 w-full rounded bg-card-bg animate-pulse" />
      </div>

      <div v-else-if="error"
        class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text">
        <span class="text-2xl">⚠️</span>
        <span>{{ error }}</span>
        <NuxtLink to="/admin/dashboard" class="ml-auto px-3 py-1 rounded-button text-sm bg-card-bg border border-border-default">
          Back to Dashboard
        </NuxtLink>
      </div>

      <template v-else-if="channelScore">
        <div class="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3">
            <NuxtLink to="/admin/dashboard" class="text-sm text-text-muted hover:text-text-primary transition-colors">
              ← Back to Dashboard
            </NuxtLink>
            <span class="text-sm text-text-muted">@{{ channelHandle }}</span>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 rounded-button text-sm font-medium bg-card-bg border border-border-default hover:bg-card-bg-attention disabled:opacity-60"
            :disabled="loading"
            @click="fetchScore(true)">
            Refresh score
          </button>
        </div>

        <ChannelScoreCard :score="channelScore" />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ChannelScoreResult } from '~~/utils/channelScore'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const route = useRoute()
const handleParam = computed(() => {
  const h = route.query.handle as string | undefined
  return h?.trim().replace(/^@/, '') || null
})

const loading = ref(true)
const error = ref<string | null>(null)
const channelScore = ref<ChannelScoreResult | null>(null)
const channelHandle = ref<string | null>(null)

const fetchScore = async (forceRefresh = false) => {
  const h = handleParam.value
  if (!h) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const url = forceRefresh
      ? `/api/channel-score?handle=${encodeURIComponent(h)}&refresh=1`
      : `/api/channel-score?handle=${encodeURIComponent(h)}`
    const res = await $fetch<{ channelScore: ChannelScoreResult; channelHandle: string }>(url)
    channelScore.value = res.channelScore
    channelHandle.value = res.channelHandle
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message ?? 'Failed to load channel score'
  } finally {
    loading.value = false
  }
}

watch(handleParam, () => fetchScore(), { immediate: true })
</script>
