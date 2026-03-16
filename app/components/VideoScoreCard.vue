<template>
  <div class="rounded-card bg-card-bg border border-border-default overflow-hidden">
    <div class="px-6 py-4 border-b border-border-default">
      <h3 class="font-bold text-lg text-text-primary">Metadata Score</h3>
      <p class="text-sm text-text-muted mt-1">
        Optimizes for Google search and YouTube recommendations. Metadata only—no content analysis.
      </p>
    </div>
    <div class="p-6 space-y-6">
      <div class="flex items-center gap-4">
        <div
          class="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2"
          :class="scoreColorClass"
        >
          {{ score.score }}
        </div>
        <div>
          <p class="text-3xl font-bold text-text-primary">{{ score.score }}/{{ score.maxPossible }}</p>
          <p class="text-sm text-text-muted">{{ scoreBadgeText }}</p>
          <p v-if="score.score < 100" class="text-xs text-text-muted mt-0.5">
            {{ 100 - score.score }} more points to reach 100
          </p>
        </div>
      </div>

      <div v-if="doingWell.length > 0" class="space-y-2">
        <h4 class="text-sm font-semibold text-merch-text">Doing well</h4>
        <ul class="space-y-2">
          <li
            v-for="step in doingWell"
            :key="step.id"
            class="flex items-start gap-2 text-sm"
          >
            <span class="text-merch-link mt-0.5">✓</span>
            <span class="text-text-primary">{{ step.name }}</span>
            <span class="text-text-muted">— {{ step.explanation }}</span>
          </li>
        </ul>
      </div>

      <div v-if="doingWell.length === 0 && toImprove.length > 0" class="space-y-2">
        <p class="text-sm text-text-muted">Start with the quick wins below—each one adds points.</p>
      </div>

      <div v-if="toImprove.length > 0" class="space-y-2">
        <h4 class="text-sm font-semibold text-alert-text">Quick wins</h4>
        <p class="text-xs text-text-muted">Small changes, big impact</p>
        <ul class="space-y-2">
          <li
            v-for="step in toImprove"
            :key="step.id"
            class="flex items-start gap-2 text-sm"
          >
            <span class="text-alert-text mt-0.5">•</span>
            <div>
              <span class="text-text-primary font-medium">{{ step.name }}</span>
              <span class="text-text-muted"> — {{ step.explanation }}</span>
              <p v-if="step.whyImportant" class="text-xs text-text-muted mt-0.5">Why it matters: {{ step.whyImportant }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="appliedPenalties.length > 0" class="space-y-2">
        <h4 class="text-sm font-semibold text-error-text">Penalties</h4>
        <ul class="space-y-2">
          <li
            v-for="p in appliedPenalties"
            :key="p.id"
            class="flex items-start gap-2 text-sm"
          >
            <span class="text-error-text mt-0.5">−</span>
            <span class="text-text-primary">{{ p.name }}</span>
            <span class="text-text-muted">— {{ p.explanation }}</span>
            <span class="text-xs text-text-muted">Fix this to recover {{ Math.abs(p.points) }} points.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VideoScoreResult } from '~~/utils/videoScore'

const props = defineProps<{
  score: VideoScoreResult
}>()

const doingWell = computed(() => props.score.steps.filter((s) => s.passed && s.points > 0))
const toImprove = computed(() =>
  props.score.steps.filter(
    (s) => (!s.passed || (s.maxPoints > 0 && s.points === 0)) && !s.explanation.includes('Coming soon')
  )
)
const appliedPenalties = computed(() => props.score.penalties.filter((p) => p.applied))

const scoreBadgeText = computed(() => {
  const s = props.score.score
  if (s >= 80) return 'Strong metadata'
  if (s >= 60) return 'Good progress'
  if (s >= 40) return 'Room to grow'
  return 'Quick wins available'
})

const scoreColorClass = computed(() => {
  const s = props.score.score
  if (s >= 80) return 'bg-merch-bg/30 border-merch-border text-merch-text'
  if (s >= 60) return 'bg-affiliate-bg/30 border-affiliate-border text-affiliate-text'
  if (s >= 40) return 'bg-alert-bg/30 border-alert-border text-alert-text'
  return 'bg-error-bg/30 border-error-border text-error-text'
})
</script>
