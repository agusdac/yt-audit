<template>
  <div class="min-h-screen flex items-center justify-center bg-page-bg">
    <div class="w-full max-w-sm rounded-card p-6 bg-card-bg border border-border-default">
      <h1 class="text-xl font-bold text-text-primary mb-4">Admin Login</h1>
      <form @submit.prevent="login" class="space-y-4">
        <div>
          <label for="password" class="block text-sm text-text-muted mb-1">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary focus:border-border-attention focus:outline-none"
            placeholder="Admin password"
            required
          />
        </div>
        <div v-if="error" class="text-sm text-error-text">{{ error }}</div>
        <button
          type="submit"
          class="w-full px-4 py-2 rounded-button font-medium bg-btn-from text-white hover:opacity-90 disabled:opacity-50"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="mt-6 pt-6 border-t border-border-default">
        <h2 class="text-sm font-semibold text-text-muted mb-3">Or impersonate a creator</h2>
        <p class="text-xs text-text-muted mb-3">
          View the app as a specific creator. Uses the same admin password.
        </p>
        <div class="space-y-3">
          <div>
            <label for="handle" class="block text-sm text-text-muted mb-1">Channel handle</label>
            <input
              id="handle"
              v-model="impersonateHandle"
              type="text"
              class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary focus:border-border-attention focus:outline-none placeholder:text-text-muted"
              placeholder="@SomeCreator"
            />
          </div>
          <button
            type="button"
            class="w-full px-4 py-2 rounded-button font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention disabled:opacity-50"
            :disabled="isLoading || !impersonateHandle.trim() || !password"
            @click="impersonate"
          >
            {{ isLoading ? 'Logging in...' : 'Login as creator' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const password = ref('')
const impersonateHandle = ref('')
const error = ref('')
const isLoading = ref(false)

const login = async () => {
  error.value = ''
  isLoading.value = true
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { password: password.value }
    })
    await navigateTo('/admin/audit')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    error.value = err?.data?.message ?? err?.message ?? 'Login failed'
  } finally {
    isLoading.value = false
  }
}

const impersonate = async () => {
  error.value = ''
  if (!impersonateHandle.value.trim() || !password.value) return
  isLoading.value = true
  try {
    const res = await $fetch<{ redirect?: string }>('/api/admin/impersonate', {
      method: 'POST',
      body: { password: password.value, handle: impersonateHandle.value.trim() }
    })
    await navigateTo(res?.redirect ?? '/dashboard')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    error.value = err?.data?.message ?? err?.message ?? 'Impersonation failed'
  } finally {
    isLoading.value = false
  }
}
</script>
