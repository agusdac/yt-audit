<template>
  <div
    class="rounded-card px-6 py-8 lg:py-10 bg-card-bg/80 backdrop-blur-sm border-2 transition-colors"
    :class="
      totalRevenueLoss > 0
        ? 'border-error-border bg-error-bg/30'
        : 'border-border-default'
    "
  >
    <p class="text-sm uppercase tracking-wider text-text-muted mb-1">
      Revenue affected findings
    </p>
    <p
      class="text-4xl lg:text-5xl font-bold font-display tabular-nums"
      :class="totalRevenueLoss > 0 ? 'text-error-text' : 'text-text-primary'"
    >
      ~${{ Math.round(totalRevenueLoss) }}/mo
    </p>
    <p
      v-if="totalRevenueLoss > 0"
      class="text-sm mt-2 text-error-text/80"
    >
      Fix dead links below to stop the bleed.
    </p>
    <p
      v-else-if="deadLinksCount === 0 && hasLinkResults"
      class="text-sm mt-2 text-merch-link"
    >
      No revenue loss from dead links.
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  totalRevenueLoss: number
  deadLinksCount: number
  hasLinkResults: boolean
}>()
</script>
