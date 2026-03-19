<template>
  <div class="min-h-screen font-sans bg-page-bg text-text-primary">
    <LandingHeader />
    <main class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="font-display text-3xl font-bold text-text-primary mb-8">Terms of Service</h1>
      <p class="text-sm text-text-muted mb-8">Last updated: {{ lastUpdated }}</p>

      <div class="prose prose-invert max-w-none space-y-6 text-text-muted">
        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">1. Acceptance</h2>
          <p>
            By using UpScrub, you agree to these terms. If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">2. Use of Service</h2>
          <p>
            UpScrub provides audit and analytics tools for YouTube creators. You must:
          </p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>Use the service only for channels you own or have permission to manage.</li>
            <li>Comply with YouTube's Terms of Service and API Services Terms.</li>
            <li>Not misuse the service or attempt to circumvent limits or access controls.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">3. Subscriptions</h2>
          <p>
            Paid plans are billed through Lemon Squeezy. You may cancel at any time. Refunds are processed according to Lemon Squeezy's policies.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">4. Disclaimer</h2>
          <p>
            UpScrub is provided "as is." We do not guarantee accuracy of revenue estimates or link checks. Use at your own risk.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">5. Limitation of Liability</h2>
          <p>
            To the extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">6. Termination</h2>
          <p>
            We may suspend or terminate access for violations of these terms. You may stop using the service at any time.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-text-primary mb-2">7. Contact</h2>
          <p>
            For questions about these terms, contact us at
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
useSeoMeta({ title: 'Terms of Service | UpScrub' })

const config = useRuntimeConfig()
const supportEmail = config.public?.supportEmail || 'support@upscrub.com'
const supportHref = `mailto:${supportEmail}`
const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
</script>
