<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary">
    <LandingHeader />
    <main>
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingAbout />
      <LandingFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'UpScrub | Audit Your YouTube Revenue',
  description: 'Find dead links, expired sponsor codes, and missed revenue in your top videos. One dashboard. One click.',
})
const { loggedIn, ready } = useUserSession()

watch([ready, loggedIn], ([r, logged]) => {
  if (r && logged) navigateTo('/dashboard')
}, { immediate: true })
</script>
