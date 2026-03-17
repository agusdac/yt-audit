<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-border-default bg-page-bg/95 backdrop-blur-sm"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
      <NuxtLink to="/" class="font-display text-xl font-bold text-text-primary">
        UpScrub
      </NuxtLink>
      <nav class="hidden items-center gap-8 md:flex">
        <a href="#features" class="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
          Features
        </a>
        <a href="#how-it-works" class="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
          How It Works
        </a>
        <a href="#pricing" class="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
          Pricing
        </a>
      </nav>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden p-2 rounded-button text-text-muted hover:text-text-primary hover:bg-card-bg"
          aria-label="Toggle menu"
          @click="mobileOpen = !mobileOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <a
          href="/auth/google"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to transition-all shadow-btn"
        >
          Get Started
        </a>
      </div>
    </div>
    <div
      v-show="mobileOpen"
      class="md:hidden border-t border-border-default bg-page-bg px-6 py-4"
    >
      <nav class="flex flex-col gap-3">
        <a href="#features" class="text-sm font-medium text-text-muted hover:text-text-primary" @click="mobileOpen = false">
          Features
        </a>
        <a href="#how-it-works" class="text-sm font-medium text-text-muted hover:text-text-primary" @click="mobileOpen = false">
          How It Works
        </a>
        <a href="#pricing" class="text-sm font-medium text-text-muted hover:text-text-primary" @click="mobileOpen = false">
          Pricing
        </a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const mobileOpen = ref(false)
</script>
