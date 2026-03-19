<template>
  <section id="pricing" class="border-t border-border-default py-16 md:py-24">
    <div class="mx-auto max-w-6xl px-6">
      <h2 class="font-display text-3xl font-bold text-text-primary mb-3 text-center">
        Start for free. Upgrade when you're ready.
      </h2>
      <p class="text-text-muted text-center max-w-2xl mx-auto mb-12">
        Choose the plan that fits your channel.
      </p>
      <div class="grid gap-6 lg:grid-cols-3">
        <div
          v-for="tier in tiers"
          :key="tier.name"
          class="rounded-card p-6 flex flex-col border transition-colors"
          :class="tier.popular ? 'border-btn-from bg-card-bg-attention/30 border-2' : 'border-border-default bg-card-bg'"
        >
          <div v-if="tier.popular" class="mb-3">
            <span class="inline-block rounded-full px-3 py-0.5 text-xs font-medium bg-gradient-to-r from-btn-from to-btn-to text-white">
              Most Popular
            </span>
          </div>
          <h3 class="font-display text-xl font-bold text-text-primary mb-1">
            {{ tier.name }}
          </h3>
          <p class="text-2xl font-bold text-text-primary mb-2">
            {{ tier.price }}
          </p>
          <p class="text-sm text-text-muted mb-4">{{ tier.description }}</p>
          <ul class="space-y-2 text-sm text-text-muted mb-6 flex-1">
            <li v-for="item in tier.features" :key="item" class="flex items-start gap-2">
              <span class="text-merch-link mt-0.5">✓</span>
              {{ item }}
            </li>
          </ul>
          <a
            :href="tier.ctaHref"
            class="block w-full rounded-button py-3 text-center font-semibold transition-all"
            :class="tier.popular
              ? 'bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to'
              : 'bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention'"
          >
            {{ tier.ctaText }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const proPrice = config.public?.proPriceDisplay ?? '$19/mo'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying things out.',
    features: [
      '1 audit per month',
      'Top 10 videos only',
      'Basic link check',
      'Summary channel score',
    ],
    ctaText: 'Get started free',
    ctaHref: '/auth/google',
    popular: false,
  },
  {
    name: 'Pro',
    price: proPrice,
    description: 'For creators ready to protect their revenue.',
    features: [
      'Unlimited audits',
      'Top 200 videos',
      'Scheduled email alerts',
      'Revenue estimates',
      'Full channel & video scores',
      'High-intent comments',
      'Export (CSV/JSON)',
    ],
    ctaText: 'Choose plan',
    ctaHref: '/auth/google',
    popular: true,
  },
  {
    name: 'Ultra',
    price: 'TBD / month',
    description: 'For teams and agencies managing multiple channels.',
    features: [
      'Everything in Pro',
      'Multiple team members',
      'Shared channel list',
      'Per-team audit history',
      'Priority support',
      'Annual discount available',
    ],
    ctaText: 'Choose plan',
    ctaHref: '/auth/google',
    popular: false,
  },
]
</script>
