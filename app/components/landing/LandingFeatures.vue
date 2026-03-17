<template>
  <section id="features" class="py-16 md:py-24">
    <div class="mx-auto max-w-6xl px-6">
      <h2 class="font-display text-3xl font-bold text-text-primary mb-3 text-center">
        Why UpScrub?
      </h2>
      <p class="text-text-muted text-center max-w-2xl mx-auto mb-12">
        UpScrub helps you protect your revenue and reputation by catching broken links and missed opportunities before your audience does.
      </p>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="rounded-card p-6 bg-card-bg border border-border-default hover:border-hover-border transition-colors"
        >
          <span class="text-3xl mb-3 block">{{ feature.icon }}</span>
          <h3 class="font-semibold text-text-primary mb-2">{{ feature.title }}</h3>
          <p class="text-sm text-text-muted">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '🔗',
    title: 'Dead links & revenue impact',
    description: "Don't leave money on the table. See exactly how much revenue each broken link costs you.",
  },
  {
    icon: '⏰',
    title: 'Expired sponsor codes',
    description: 'Catch outdated promo codes and affiliate links before viewers hit 404s.',
  },
  {
    icon: '💬',
    title: 'High-intent comments',
    description: "Have you missed any possible leads? Find viewers asking 'where can I buy?' or for discount codes.",
  },
  {
    icon: '📈',
    title: 'Channel & video scores',
    description: '100-point metadata scores for your channel and videos—storefront health at a glance.',
  },
]
</script>
