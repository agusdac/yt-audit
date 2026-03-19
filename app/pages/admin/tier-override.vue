<template>
  <div class="p-6">
    <div class="max-w-xl mx-auto">
      <div class="rounded-card p-6 bg-card-bg border border-border-default">
        <h2 class="font-semibold text-text-primary mb-4">Override user tier</h2>
        <p class="text-sm text-text-muted mb-4">
          Set a user's tier for testing. Override takes precedence over subscription. Use "Clear" to remove override.
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">User ID (UUID)</label>
            <input
              v-model="userId"
              type="text"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">Override tier</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="tierOverride" type="radio" value="free" class="rounded-full" />
                <span class="text-sm text-text-primary">Free</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="tierOverride" type="radio" value="pro" class="rounded-full" />
                <span class="text-sm text-text-primary">Pro</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="tierOverride" type="radio" value="clear" class="rounded-full" />
                <span class="text-sm text-text-primary">Clear override</span>
              </label>
            </div>
          </div>
          <div v-if="message" class="text-sm" :class="messageSuccess ? 'text-merch-link' : 'text-error-text'">
            {{ message }}
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60"
            :disabled="!userId || saving"
            @click="submit"
          >
            {{ saving ? 'Saving...' : 'Set override' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const userId = ref('')
const tierOverride = ref<'free' | 'pro' | 'clear'>('pro')
const saving = ref(false)
const message = ref('')
const messageSuccess = ref(false)

const submit = async () => {
  if (!userId.value.trim()) return
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/admin/tier-override', {
      method: 'POST',
      body: {
        userId: userId.value.trim(),
        tier: tierOverride.value === 'clear' ? null : tierOverride.value
      }
    })
    message.value = tierOverride.value === 'clear' ? 'Override cleared.' : `Tier set to ${tierOverride.value}.`
    messageSuccess.value = true
  } catch (e) {
    const err = e as { data?: { message?: string }; message?: string }
    message.value = err?.data?.message ?? err?.message ?? 'Failed to set override'
    messageSuccess.value = false
  } finally {
    saving.value = false
  }
}
</script>
