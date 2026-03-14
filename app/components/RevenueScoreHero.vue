<template>
  <div
    class="rounded-card px-4 py-4 bg-card-bg/80 backdrop-blur-sm border transition-colors"
    :class="
      totalRevenueLoss > 0
        ? 'border-error-border bg-error-bg/20'
        : 'border-border-default'
    "
  >
    <div class="flex items-baseline gap-3 flex-wrap">
      <span class="text-xs uppercase tracking-wider text-text-muted">Revenue affected</span>
      <span
        class="text-2xl font-bold font-display tabular-nums"
        :class="totalRevenueLoss > 0 ? 'text-error-text' : 'text-text-primary'"
      >
        ~${{ Math.round(totalRevenueLoss) }}/mo
      </span>
      <span v-if="totalRevenueLoss > 0" class="text-xs text-error-text/80">Fix dead links below.</span>
      <span v-else-if="deadLinksCount === 0 && hasLinkResults" class="text-xs text-merch-link">No loss.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  totalRevenueLoss: number
  deadLinksCount: number
  hasLinkResults: boolean
}>()
</script>
