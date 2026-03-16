<template>
  <div
    v-if="items.length > 0"
    class="rounded-card overflow-hidden"
    :class="variant === 'dead' ? 'bg-error-bg/20 border border-error-border' : 'bg-alert-bg/20 border border-alert-border'"
  >
    <button
      type="button"
      class="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-filter-bg transition-colors"
      @click="open = !open"
    >
      <h3
        class="font-bold text-lg"
        :class="variant === 'dead' ? 'text-error-text' : 'text-alert-text'"
      >
        {{ title }}
      </h3>
      <span
        class="text-sm"
        :class="variant === 'dead' ? 'text-error-text/80' : 'text-alert-text/80'"
      >
        {{ items.length }} link{{ items.length > 1 ? 's' : '' }}
      </span>
      <span
        class="text-xl transition-transform"
        :class="[variant === 'dead' ? 'text-error-text' : 'text-alert-text', open ? 'rotate-180' : '']"
      >
        ▼
      </span>
    </button>
    <div v-show="open" class="p-6 pt-0 max-h-[320px] overflow-y-auto scroll-area">
      <div class="space-y-4">
        <div
          v-for="item in items"
          :key="item.url"
          class="rounded-lg p-4 bg-card-bg space-y-3"
          :class="variant === 'dead' ? 'border border-error-border' : 'border border-alert-border'"
        >
          <p
            class="text-sm break-all font-mono"
            :class="variant === 'dead' ? 'text-error-text line-through' : 'text-alert-text'"
          >
            {{ item.url }}
          </p>
          <p class="text-sm text-text-muted">
            {{ item.videoIds.length }} video{{ item.videoIds.length > 1 ? 's' : '' }} affected
            <template v-if="variant === 'dead' && item.revenueLoss != null">
              · ~${{ Math.round(item.revenueLoss) }}/month estimated loss
            </template>
          </p>
          <div class="flex flex-wrap gap-2 items-center">
            <label class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-sm text-text-muted whitespace-nowrap">Replace with:</span>
              <input
                :model-value="replacementUrls[item.url]"
                type="url"
                placeholder="https://new-link.com"
                class="flex-1 min-w-[200px] px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted"
                @input="(e) => $emit('update:replacement', item.url, (e.target as HTMLInputElement).value)"
              />
            </label>
          </div>
          <div class="flex flex-wrap gap-2">
            <a
              v-if="item.firstVideoId"
              :href="`https://studio.youtube.com/video/${item.firstVideoId}/edit`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold hover:opacity-90 transition-all"
              :class="variant === 'dead' ? 'bg-error-bg border-2 border-error-border text-error-text hover:border-error-text' : 'bg-alert-bg border-2 border-alert-border text-alert-text'"
            >
              {{ variant === 'dead' ? 'Fix: Edit in YouTube Studio →' : 'Edit in YouTube Studio →' }}
            </a>
            <button
              v-if="replacementUrls[item.url]"
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
              @click="$emit('copy-replacement-list', item)"
            >
              Copy replacement list
            </button>
            <button
              v-if="item.videoIds?.length"
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
              @click="$emit('copy-studio-urls', item.videoIds)"
            >
              Copy Studio URLs
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant: 'dead' | 'redirected'
  title: string
  items: Array<{
    url: string
    videoIds: string[]
    revenueLoss?: number
    firstVideoId?: string
  }>
  replacementUrls: Record<string, string>
}>()

defineEmits<{
  'update:replacement': [url: string, value: string]
  'copy-replacement-list': [item: { url: string; videoIds: string[] }]
  'copy-studio-urls': [videoIds: string[]]
}>()

const open = ref(true)
</script>
