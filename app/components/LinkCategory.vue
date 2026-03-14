<template>
  <div class="flex flex-wrap gap-2 items-center">
    <span
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      :class="categoryClass"
    >
      {{ label }}
    </span>
    <template v-for="url in urls" :key="url">
      <span v-if="isUserSponsorLink(url)" class="text-xs text-alert-text">(My)</span>
      <span v-if="hasCodeIssue(url)" class="text-xs text-alert-text" title="Code may be expired">⚠</span>
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        :class="['text-sm hover:underline truncate max-w-[200px]', linkClass(url, defaultLinkClass)]"
      >
        {{ url }}
      </a>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  urls: string[]
  className: 'sponsor' | 'affiliate' | 'merch' | 'other'
  isUserSponsorLink: (url: string) => boolean
  hasCodeIssue: (url: string) => boolean
  linkClass: (url: string, defaultClass: string) => string
}>()

const categoryClassMap = {
  sponsor: 'bg-sponsor-bg text-sponsor-text border border-sponsor-border',
  affiliate: 'bg-affiliate-bg text-affiliate-text border border-affiliate-border',
  merch: 'bg-merch-bg text-merch-text border border-merch-border',
  other: 'bg-other-bg text-other-text border border-other-border'
}

const linkClassMap = {
  sponsor: 'text-sponsor-link',
  affiliate: 'text-affiliate-link',
  merch: 'text-merch-link',
  other: 'text-other-link'
}

const categoryClass = categoryClassMap[props.className]
const defaultLinkClass = linkClassMap[props.className]
</script>
