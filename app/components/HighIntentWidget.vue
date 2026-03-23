<template>
  <div
    class="rounded-card p-5 lg:p-6 h-fit backdrop-blur-sm border-2 transition-colors"
    :class="tier === 'free' ? 'bg-card-bg-attention border-border-default' : cardClass"
  >
    <h3 class="font-bold text-sm uppercase tracking-wider text-text-muted mb-3">
      High-intent comments
    </h3>

    <div v-if="tier === 'free'" class="space-y-3">
      <p v-if="isFetchingComments" class="text-sm text-text-muted">Loading…</p>
      <template v-else>
        <p class="text-sm text-text-muted">
          See purchase-intent comments from your viewers—where to buy, discount codes, and more. This is a Pro feature.
        </p>
        <NuxtLink
          to="/settings"
          class="block w-full text-center px-4 py-2.5 rounded-button text-sm font-semibold bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to transition-colors text-white"
        >
          Upgrade to Pro
        </NuxtLink>
      </template>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="commentsStatus === 'loading'" class="space-y-3">
        <div class="h-2 rounded-full bg-border-default overflow-hidden">
          <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-2/3" />
        </div>
        <p class="text-sm text-text-muted">Scanning comments...</p>
      </div>

      <!-- Not run yet -->
      <div v-else-if="commentsStatus === 'idle'" class="space-y-3">
        <p class="text-sm text-text-muted">
          Run a comment scan to find viewers asking where to buy or for discount codes.
        </p>
        <button
          type="button"
          class="w-full px-4 py-2.5 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="!hasVideos || isFetchingComments"
          @click="onFetchComments?.()"
        >
          Run comment scan
        </button>
      </div>

      <!-- None - you're alright -->
      <div v-else-if="commentsStatus === 'none'" class="space-y-2">
        <p class="text-base font-semibold text-merch-link">
          You're alright
        </p>
        <p class="text-sm text-text-muted">
          No high-intent comments found. Keep creating.
        </p>
      </div>

      <!-- Has comments -->
      <div v-else-if="commentsStatus === 'hasComments'" class="space-y-3">
        <p class="text-base font-semibold text-alert-text">
          {{ highIntentComments.length }} potential {{ highIntentComments.length === 1 ? 'lead' : 'leads' }}
        </p>
        <p class="text-sm text-text-muted">
          Answer these comments to convert viewers into customers.
        </p>
        <NuxtLink
          :to="viewCommentsHref"
          class="block w-full text-center px-4 py-2.5 rounded-button text-sm font-semibold bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to transition-colors"
        >
          View comments
        </NuxtLink>
        <div class="space-y-2 pt-2 border-t border-border-default">
          <div
            v-for="c in highIntentComments.slice(0, 2)"
            :key="c.id"
            class="text-xs text-text-muted line-clamp-2"
          >
            "{{ c.text }}"
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HighIntentComment } from '~~/stores/creatorWorkspace'

const props = withDefaults(
  defineProps<{
    tier?: 'free' | 'pro'
    commentsStatus: 'idle' | 'loading' | 'hasComments' | 'none'
    highIntentComments: HighIntentComment[]
    hasVideos: boolean
    isFetchingComments: boolean
    viewCommentsHref: string
    onFetchComments?: () => void
  }>(),
  { onFetchComments: undefined, tier: 'free' }
)

const cardClass = computed(() => {
  switch (props.commentsStatus) {
    case 'loading':
      return 'bg-stat-bg border-border-default'
    case 'idle':
      return 'bg-stat-bg border-border-default'
    case 'none':
      return 'bg-merch-bg/50 border-merch-border'
    case 'hasComments':
      return 'bg-alert-bg border-alert-border'
    default:
      return 'bg-stat-bg border-border-default'
  }
})
</script>
