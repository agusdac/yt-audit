<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-text-primary mb-2">Revenue Settings</h1>
    <p class="text-text-muted mb-6">
      Customize revenue estimates for your niche. Leave blank to use defaults.
    </p>

    <div v-if="store.error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">&#9888;</span>
      <span>{{ store.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
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
        <div class="flex items-center gap-3 mb-3">
          <input id="scheduled-audit" v-model="form.scheduledAuditEnabled" type="checkbox"
            class="rounded border-border-default" />
          <label for="scheduled-audit" class="text-sm font-medium text-text-primary">Enable scheduled audit
            emails</label>
        </div>
        <div v-if="form.scheduledAuditEnabled" class="ml-6 space-y-2">
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
          class="px-6 py-2 rounded-button font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
          @click="reset">
          Reset to defaults
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})

const store = useCreatorWorkspaceStore()
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

const save = async () => {
  const s = form.value
  const settings: Record<string, number | string[] | boolean | 'weekly' | 'monthly'> = {}
  if (typeof s.cpmSponsor === 'number') settings.cpmSponsor = s.cpmSponsor
  if (typeof s.ctrAffiliate === 'number') settings.ctrAffiliate = s.ctrAffiliate
  if (typeof s.convAffiliate === 'number') settings.convAffiliate = s.convAffiliate
  if (typeof s.avgCommission === 'number') settings.avgCommission = s.avgCommission
  const domains = s.sponsorDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
  if (domains.length > 0) settings.sponsorDomains = domains
  settings.scheduledAuditEnabled = s.scheduledAuditEnabled
  if (s.scheduledAuditEnabled) settings.scheduledAuditFrequency = s.scheduledAuditFrequency
  await store.saveCreatorSettings(settings)
}

const reset = () => {
  form.value = { sponsorDomains: '', scheduledAuditEnabled: false, scheduledAuditFrequency: 'weekly', cpmSponsor: undefined, ctrAffiliate: undefined, convAffiliate: undefined, avgCommission: undefined }
  store.saveCreatorSettings({})
}
</script>
