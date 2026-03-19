<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-text-primary mb-2">Settings</h1>

    <div class="rounded-card p-6 bg-card-bg border border-border-default mb-6">
      <h2 class="text-lg font-semibold text-text-primary mb-3">Plan</h2>
      <div class="flex flex-wrap items-center gap-4 mb-4">
        <span class="inline-flex px-3 py-1 rounded-button text-sm font-medium" :class="tier.tier.value === 'pro'
          ? 'bg-gradient-to-r from-btn-from/20 to-btn-to/20 border border-btn-from/40 text-btn-from'
          : 'bg-card-bg border border-border-default text-text-muted'">
          {{ tier.tier.value === 'pro' ? 'Pro' : 'Free' }}
        </span>
        <span class="text-sm text-text-muted">
          {{ tier.auditsLimit === null
            ? 'Unlimited audits'
            : `${tier.auditsUsedThisMonth} / ${tier.auditsLimit} audits this month` }}
        </span>
      </div>
      <p v-if="tier.currentPeriodEnd.value && tier.tier.value === 'pro'" class="text-sm text-text-muted mb-4">
        Your plan renews on {{ formatDate(tier.currentPeriodEnd.value) }}.
      </p>
      <div v-if="checkoutError" class="text-sm text-error-text mb-3">{{ checkoutError }}</div>
      <p v-if="supportHref" class="text-sm text-text-muted mb-3">
        <a :href="supportHref" target="_blank" rel="noopener noreferrer" class="text-merch-link hover:underline">
          Contact support
        </a>
      </p>
      <div class="flex flex-wrap gap-3">
        <button v-if="tier.tier.value === 'free'" type="button"
          class="inline-flex px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to"
          @click="goToCheckout">
          Upgrade to Pro
        </button>
        <a v-else-if="tier.canManageSubscription.value && tier.manageSubscriptionUrl.value"
          :href="tier.manageSubscriptionUrl.value" target="_blank" rel="noopener noreferrer"
          class="inline-flex px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention">
          Manage subscription
        </a>
      </div>
    </div>

    <h2 class="text-xl font-bold text-text-primary mb-2">Revenue Settings</h2>
    <p class="text-text-muted mb-6">
      Customize revenue estimates for your niche. Leave blank to use defaults.
    </p>

    <div v-if="store.error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">&#9888;</span>
      <span>{{ store.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
    </div>

    <div v-if="successMessage"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-green-500/20 border border-green-500/50 text-green-700 dark:text-green-400 mb-6">
      <span class="text-2xl">&#10003;</span>
      <span>{{ successMessage }}</span>
    </div>

    <div class="rounded-card p-6 bg-card-bg border border-border-default space-y-6">
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">Sponsor CPM ($/1000 views)</label>
        <input v-model.number="form.cpmSponsor" type="number" min="0" step="1" placeholder="25 (default)"
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted" />
      </div>
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">Affiliate CTR (0–1, e.g. 0.015 = 1.5%)</label>
        <input v-model.number="form.ctrAffiliate" type="number" min="0" max="1" step="0.001"
          placeholder="0.015 (default)"
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted" />
      </div>
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">Affiliate conversion rate (0–1, e.g. 0.05 =
          5%)</label>
        <input v-model.number="form.convAffiliate" type="number" min="0" max="1" step="0.01"
          placeholder="0.05 (default)"
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted" />
      </div>
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">Avg commission per conversion ($)</label>
        <input v-model.number="form.avgCommission" type="number" min="0" step="0.5" placeholder="5 (default)"
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted" />
      </div>
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">My sponsor domains (comma-separated)</label>
        <input v-model="form.sponsorDomains" type="text" placeholder="nordvpn.com, expressvpn.com"
          class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted" />
        <p class="text-xs text-text-muted mt-1">Links matching these domains are classified as sponsor links.</p>
      </div>

      <div class="border-t border-border-default pt-6">
        <h2 class="text-lg font-semibold text-text-primary mb-3">Scheduled audit emails</h2>
        <p class="text-sm text-text-muted mb-4">
          Get a weekly or monthly email with dead-link alerts for your linked channels. Requires at least one linked
          channel.
        </p>
        <div v-if="tier.tier.value === 'free'"
          class="rounded-card p-4 bg-card-bg-attention border border-border-default mb-3">
          <p class="text-sm text-text-muted mb-2">Upgrade to Pro to enable scheduled audit emails.</p>
          <button type="button"
            class="inline-flex px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to"
            @click="goToCheckout">
            Upgrade to Pro
          </button>
        </div>
        <div v-else class="flex items-center gap-3 mb-3">
          <input id="scheduled-audit" v-model="form.scheduledAuditEnabled" type="checkbox"
            class="rounded border-border-default" />
          <label for="scheduled-audit" class="text-sm font-medium text-text-primary">Enable scheduled audit
            emails</label>
        </div>
        <div v-if="form.scheduledAuditEnabled && tier.tier.value === 'pro'" class="ml-6 space-y-2">
          <label class="block text-sm font-medium text-text-primary">Frequency</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.scheduledAuditFrequency" type="radio" value="weekly" class="rounded-full" />
              <span class="text-sm text-text-primary">Weekly</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.scheduledAuditFrequency" type="radio" value="monthly" class="rounded-full" />
              <span class="text-sm text-text-primary">Monthly</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="button"
          class="px-6 py-2 rounded-button font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
          @click="save">
          Save
        </button>
        <button type="button"
          class="px-6 py-2 rounded-button font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="saving" @click="reset">
          Reset to defaults
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'
import { useTier } from '~~/composables/useTier'
import { formatDate } from '~~/utils/format'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})
useSeoMeta({ title: 'Settings | UpScrub' })

const store = useCreatorWorkspaceStore()
const tier = useTier()
const config = useRuntimeConfig()
const supportHref = config.public?.supportUrl as string || `mailto:${config.public?.supportEmail || 'support@upscrub.com'}`

const checkoutError = ref<string | null>(null)
const goToCheckout = async () => {
  checkoutError.value = null
  try {
    const { url } = await $fetch<{ url: string }>('/api/checkout-url')
    if (url) window.location.href = url
  } catch (e) {
    const err = e as { data?: { message?: string }; message?: string }
    checkoutError.value = err?.data?.message ?? err?.message ?? 'Failed to open checkout'
  }
}
const successMessage = ref<string | null>(null)
const saving = ref(false)
const form = ref({
  cpmSponsor: undefined as number | undefined,
  ctrAffiliate: undefined as number | undefined,
  convAffiliate: undefined as number | undefined,
  avgCommission: undefined as number | undefined,
  sponsorDomains: '' as string,
  scheduledAuditEnabled: false as boolean,
  scheduledAuditFrequency: 'monthly' as 'weekly' | 'monthly'
})

onMounted(async () => {
  await store.loadCreatorSettings()
  if (store.creatorSettings) {
    form.value = {
      ...store.creatorSettings,
      sponsorDomains: store.creatorSettings.sponsorDomains?.join(', ') ?? '',
      scheduledAuditEnabled: store.creatorSettings.scheduledAuditEnabled ?? false,
      scheduledAuditFrequency: store.creatorSettings.scheduledAuditFrequency ?? 'weekly',
      cpmSponsor: store.creatorSettings.cpmSponsor ?? undefined,
      ctrAffiliate: store.creatorSettings.ctrAffiliate ?? undefined,
      convAffiliate: store.creatorSettings.convAffiliate ?? undefined,
      avgCommission: store.creatorSettings.avgCommission ?? undefined,
    }
  }
})

let successTimeout: ReturnType<typeof setTimeout> | null = null

const save = async () => {
  successMessage.value = null
  const s = form.value
  const settings: Record<string, number | string[] | boolean | 'weekly' | 'monthly'> = {}
  if (typeof s.cpmSponsor === 'number') settings.cpmSponsor = s.cpmSponsor
  if (typeof s.ctrAffiliate === 'number') settings.ctrAffiliate = s.ctrAffiliate
  if (typeof s.convAffiliate === 'number') settings.convAffiliate = s.convAffiliate
  if (typeof s.avgCommission === 'number') settings.avgCommission = s.avgCommission
  const domains = s.sponsorDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
  if (domains.length > 0) settings.sponsorDomains = domains
  settings.scheduledAuditEnabled = tier.tier.value === 'pro' ? s.scheduledAuditEnabled : false
  if (settings.scheduledAuditEnabled) settings.scheduledAuditFrequency = s.scheduledAuditFrequency
  saving.value = true
  try {
    const ok = await store.saveCreatorSettings(settings)
    if (ok) {
      successMessage.value = 'Settings saved successfully'
      if (successTimeout) clearTimeout(successTimeout)
      successTimeout = setTimeout(() => {
        successMessage.value = null
        successTimeout = null
      }, 4000)
    }
  } finally {
    saving.value = false
  }
}

const reset = async () => {
  successMessage.value = null
  saving.value = true
  try {
    const ok = await store.saveCreatorSettings({})
    await store.loadCreatorSettings()
    if (ok) {
      successMessage.value = 'Settings reset to defaults'
      if (successTimeout) clearTimeout(successTimeout)
      successTimeout = setTimeout(() => {
        successMessage.value = null
        successTimeout = null
      }, 4000)
    }
    if (store.creatorSettings) {
      form.value = {
        ...store.creatorSettings,
        sponsorDomains: store.creatorSettings.sponsorDomains?.join(', ') ?? '',
        scheduledAuditEnabled: store.creatorSettings.scheduledAuditEnabled ?? false,
        scheduledAuditFrequency: store.creatorSettings.scheduledAuditFrequency ?? 'weekly',
        cpmSponsor: store.creatorSettings.cpmSponsor ?? undefined,
        ctrAffiliate: store.creatorSettings.ctrAffiliate ?? undefined,
        convAffiliate: store.creatorSettings.convAffiliate ?? undefined,
        avgCommission: store.creatorSettings.avgCommission ?? undefined,
      }
    } else {
      form.value = { sponsorDomains: '', scheduledAuditEnabled: false, scheduledAuditFrequency: 'weekly', cpmSponsor: undefined, ctrAffiliate: undefined, convAffiliate: undefined, avgCommission: undefined }
    }
  } finally {
    saving.value = false
  }
}
</script>
