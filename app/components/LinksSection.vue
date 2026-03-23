<template>
  <div>
    <span class="text-xs font-medium text-text-muted uppercase block mb-2">{{ label }}</span>
    <ul class="space-y-2">
      <li v-for="url in urls" :key="url" class="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span
            v-if="linkStatus(url)"
            class="inline-flex px-1.5 py-0.5 rounded text-xs flex-shrink-0"
            :class="linkStatus(url) === 'dead' ? 'bg-error-bg text-error-text' : 'bg-alert-bg text-alert-text'"
          >
            {{ linkStatus(url) }}
          </span>
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-hover-link hover:underline truncate max-w-md"
          >
            {{ url }}
          </a>
        </div>
        <NuxtLink
          v-if="tier === 'pro' && videoId && linkStatus(url) === 'dead'"
          :to="bulkReplaceHref(url)"
          class="inline-flex text-xs font-medium text-btn-from hover:underline sm:ml-auto flex-shrink-0"
        >
          Bulk replace
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { LinkCheckResult } from '~~/types/links'

const props = defineProps<{
  label: string
  urls: string[]
  linkResults: LinkCheckResult[]
  videoId: string
  tier?: 'free' | 'pro'
}>()

const linkStatus = (url: string): 'dead' | 'redirected' | null => {
  const r = props.linkResults.find(
    (x) => x.videoIds.includes(props.videoId) && (x.url === url || x.requestedUrl === url)
  )
  if (!r) return null
  if (r.category === 'dead') return 'dead'
  if (r.category === 'redirected') return 'redirected'
  return null
}

const bulkReplaceHref = (oldUrl: string) => {
  const params = new URLSearchParams()
  params.set('oldUrl', oldUrl)
  params.set('videoIds', props.videoId)
  return `/bulk-links?${params.toString()}`
}
</script>
