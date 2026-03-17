<template>
  <section id="how-it-works" class="border-t border-border-default py-16 md:py-24">
    <div class="mx-auto max-w-6xl px-6">
      <h2 class="font-display text-3xl font-bold text-text-primary mb-3 text-center">
        How It Works
      </h2>
      <p class="text-text-muted text-center max-w-2xl mx-auto mb-12">
        Three simple steps to a healthier channel.
      </p>
      <div class="grid gap-8 md:grid-cols-3">
        <div
          v-for="(step, i) in steps"
          :key="step.title"
          class="rounded-card p-6 bg-card-bg border border-border-default text-center"
        >
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-btn-from to-btn-to text-lg font-bold text-white mb-4">
            {{ i + 1 }}
          </span>
          <h3 class="font-semibold text-text-primary mb-2">{{ step.title }}</h3>
          <p class="text-sm text-text-muted">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    title: 'Connect your YouTube channel',
    description: 'Sign in with Google. We use read-only access to fetch your videos and descriptions.',
  },
  {
    title: 'Run an audit',
    description: 'We scan your top videos and check every link. Dead links, redirects, and expired codes—all in one report.',
  },
  {
    title: 'Fix and monitor',
    description: 'Update your descriptions, then get weekly or monthly email alerts so you never miss a broken link again.',
  },
]
</script>
