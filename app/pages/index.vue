<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary">
    <header class="relative overflow-hidden border-b border-border-default">
      <div class="absolute inset-0 bg-gradient-to-br from-hero-from via-transparent to-hero-to" />
      <div class="relative max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          <span class="bg-gradient-to-r from-title-from via-title-via to-title-to bg-clip-text text-transparent">
            Link Audit for YouTube Creators
          </span>
        </h1>
        <p class="text-lg max-w-2xl mx-auto mb-6 text-text-muted">
          Find dead links, expired sponsor codes, and outdated affiliates in your top videos—before your audience does.
        </p>
        <ul class="text-left max-w-md mx-auto mb-10 space-y-2 text-text-muted">
          <li class="flex items-center gap-2">
            <span class="text-error-text">●</span> Detect 404s and broken sponsor links
          </li>
          <li class="flex items-center gap-2">
            <span class="text-alert-text">●</span> Catch expired promo codes
          </li>
          <li class="flex items-center gap-2">
            <span class="text-merch-link">●</span> See estimated revenue impact
          </li>
        </ul>
        <a href="/auth/google"
          class="inline-flex items-center gap-2 px-8 py-4 rounded-button font-semibold text-lg transition-all duration-200 bg-white text-gray-800 hover:bg-gray-100 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
          <svg class="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </a>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ title: 'Link Audit for YouTube Creators | YT-Audit' })
const { loggedIn, ready } = useUserSession()

watch([ready, loggedIn], ([r, logged]) => {
  if (r && logged) navigateTo('/dashboard')
}, { immediate: true })
</script>
