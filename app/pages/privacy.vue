<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary">
    <LandingHeader />
    <main class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="font-display text-3xl font-bold text-text-primary mb-8">Privacy Policy</h1>
      <p class="text-sm text-text-muted mb-8">Last updated: {{ lastUpdated }}</p>

      <div class="prose prose-invert max-w-none space-y-6 text-text-muted">
        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">1. Data We Collect</h2>
          <p>
            When you use UpScrub, we collect and process:
          </p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li><strong class="text-text-primary">Account data:</strong> Email, name, and profile picture from Google when you sign in.</li>
            <li><strong class="text-text-primary">YouTube data:</strong> Channel information, video metadata, descriptions, and comments—accessed via YouTube Data API with your consent.</li>
            <li><strong class="text-text-primary">Usage data:</strong> Audit results, link checks, and settings you configure.</li>
            <li><strong class="text-text-primary">Payment data:</strong> Handled by Lemon Squeezy (our payment provider). We store subscription status and billing identifiers, not card details.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">2. How We Use Your Data</h2>
          <p>
            We use your data to provide audit features, link checking, revenue estimates, and subscription management. We do not sell your data to third parties.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">3. Cookies and Sessions</h2>
          <p>
            We use session cookies to keep you logged in. These are essential for the service and do not track you across other sites.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">4. Third-Party Services</h2>
          <p>
            We use Google OAuth for sign-in and YouTube Data API for channel data. For payments, we use Lemon Squeezy. Each has its own privacy policy. We only share data necessary to operate the service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">5. Your Rights (GDPR)</h2>
          <p>
            If you are in the EU/EEA, you have the right to access, correct, delete, or restrict processing of your data. You can request deletion by contacting us. We may retain data required for legal or compliance purposes.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">6. Contact</h2>
          <p>
            For privacy-related questions or requests, contact us at
            <a :href="supportHref" class="text-merch-link hover:underline">{{ supportEmail }}</a>.
          </p>
        </section>
      </div>

      <div class="mt-12 pt-8 border-t border-border-default">
        <NuxtLink to="/" class="text-merch-link hover:underline">Back to home</NuxtLink>
      </div>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ title: 'Privacy Policy | UpScrub' })

const config = useRuntimeConfig()
const supportEmail = config.public?.supportEmail || 'support@upscrub.com'
const supportHref = `mailto:${supportEmail}`
const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
</script>
