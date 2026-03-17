<template>
  <footer class="border-t border-border-default py-8">
    <div class="mx-auto max-w-6xl px-6">
      <div class="flex flex-col items-center justify-between gap-6 md:flex-row">
        <NuxtLink to="/" class="font-display text-lg font-bold text-text-primary">
          UpScrub
        </NuxtLink>
        <nav class="flex items-center gap-6">
          <a href="#features" class="text-sm text-text-muted hover:text-text-primary transition-colors">
            Features
          </a>
          <a href="#how-it-works" class="text-sm text-text-muted hover:text-text-primary transition-colors">
            How It Works
          </a>
          <a href="#pricing" class="text-sm text-text-muted hover:text-text-primary transition-colors">
            Pricing
          </a>
          <NuxtLink to="/privacy" class="text-sm text-text-muted hover:text-text-primary transition-colors">
            Privacy Policy
          </NuxtLink>
        </nav>
      </div>
      <p class="mt-6 text-center text-sm text-text-muted md:text-left">
        Copyright © {{ new Date().getFullYear() }}. UpScrub. All rights reserved.
      </p>
    </div>
  </footer>
</template>
