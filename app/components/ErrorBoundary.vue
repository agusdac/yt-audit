<template>
  <div v-if="caught" class="rounded-card p-6 bg-error-bg border border-error-border text-error-text">
    <p class="font-semibold mb-2">Something went wrong</p>
    <p class="text-sm mb-4">{{ caught.message || 'An unexpected error occurred.' }}</p>
    <button
      type="button"
      class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
      @click="retry"
    >
      Try again
    </button>
  </div>
  <div v-else :key="retryCount">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  retry: []
}>()

const caught = ref<Error | null>(null)
const retryCount = ref(0)

onErrorCaptured((err: unknown) => {
  caught.value = err instanceof Error ? err : new Error(String(err))
  return false // prevent propagation
})

const retry = () => {
  caught.value = null
  retryCount.value++
  emit('retry')
}
</script>
