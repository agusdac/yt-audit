<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-text-primary mb-2">Bulk replace link</h1>
    <p class="text-text-muted mb-6">
      Replace a link across multiple video descriptions. Requires Pro and YouTube write access.
    </p>

    <div v-if="tier.tier.value !== 'pro'" class="rounded-card p-6 bg-card-bg-attention border border-border-default mb-6">
      <p class="text-text-muted mb-3">Bulk link update is a Pro feature.</p>
      <NuxtLink to="/settings"
        class="inline-flex px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to">
        Upgrade to Pro
      </NuxtLink>
    </div>

    <div v-else class="rounded-card p-6 bg-card-bg border border-border-default space-y-4">
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">Old URL (to replace)</label>
        <input
          v-model="oldUrl"
          type="text"
          placeholder="https://old-link.com/expired"
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted font-mono text-sm"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">New URL</label>
        <input
          v-model="newUrl"
          type="text"
          placeholder="https://new-link.com/active"
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted font-mono text-sm"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">Video IDs (comma-separated)</label>
        <input
          v-model="videoIdsInput"
          type="text"
          placeholder="dQw4w9WgXcQ, abc123..."
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted font-mono text-sm"
        />
        <p class="text-xs text-text-muted mt-1">{{ videoIdsArray.length }} video(s) selected</p>
      </div>

      <div v-if="error" class="rounded-card px-4 py-3 bg-error-bg border border-error-border text-error-text flex flex-wrap items-center gap-3">
        <span class="flex-1 min-w-0">{{ error }}</span>
        <NuxtLink
          v-if="isProRequiredError"
          to="/settings"
          class="px-3 py-1 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to"
        >
          Upgrade to Pro
        </NuxtLink>
      </div>
      <div v-if="success" class="text-sm text-merch-link">
        Updated {{ result?.updated ?? 0 }} video(s).
        <span v-if="(result?.failed?.length ?? 0) > 0">
          {{ result!.failed!.length }} failed.
        </span>
      </div>

      <button
        type="button"
        class="px-6 py-2 rounded-button font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="!canApply || applying"
        @click="apply"
      >
        {{ applying ? 'Updating...' : 'Apply' }}
      </button>
    </div>

    <div class="mt-6">
      <NuxtLink to="/dashboard" class="text-sm text-text-muted hover:text-hover-link">
        ← Back to Dashboard
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTier } from '~~/composables/useTier'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})
useSeoMeta({ title: 'Bulk Replace Link | UpScrub' })

const route = useRoute()
const tier = useTier()

const oldUrl = ref('')
const newUrl = ref('')
const videoIdsInput = ref('')
const applying = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const result = ref<{ updated: number; failed?: Array<{ videoId: string; error: string }> } | null>(null)

const videoIdsArray = computed(() =>
  videoIdsInput.value
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean)
)

const canApply = computed(() =>
  oldUrl.value.trim().length > 0 &&
  newUrl.value.trim().length > 0 &&
  videoIdsArray.value.length > 0
)

const isProRequiredError = computed(() => {
  const msg = error.value?.toLowerCase() ?? ''
  return msg.includes('pro') && (msg.includes('feature') || msg.includes('upgrade'))
})

onMounted(() => {
  const q = route.query
  if (typeof q.oldUrl === 'string') oldUrl.value = q.oldUrl
  if (Array.isArray(q.videoIds)) {
    videoIdsInput.value = q.videoIds.join(', ')
  } else if (typeof q.videoIds === 'string') {
    videoIdsInput.value = q.videoIds
  }
})

const apply = async () => {
  if (!canApply.value) return
  applying.value = true
  error.value = null
  success.value = false
  result.value = null
  try {
    const res = await $fetch<{ updated: number; failed?: Array<{ videoId: string; error: string }> }>(
      '/api/bulk-update-links',
      {
        method: 'POST',
        body: {
          videoIds: videoIdsArray.value,
          oldUrl: oldUrl.value.trim(),
          newUrl: newUrl.value.trim()
        }
      }
    )
    result.value = res
    success.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string; code?: string }; statusCode?: number; message?: string }
    error.value = err?.data?.message ?? err?.message ?? 'Failed to update links'
  } finally {
    applying.value = false
  }
}
</script>
