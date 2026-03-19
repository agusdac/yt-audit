<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="store.error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">⚠️</span>
      <span>{{ store.error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="store.clearError">Dismiss</button>
    </div>

    <div v-if="!store.me?.linkedChannels?.length" class="rounded-card p-6 bg-card-bg border border-border-default">
      <p class="text-text-muted">No YouTube channels linked. Sign in with a Google account that has a YouTube channel.</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 class="text-2xl font-bold text-text-primary">High-Intent Comments</h1>
        <button
          type="button"
          class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="store.isFetchingComments || store.videos.length === 0"
          @click="store.fetchComments"
        >
          {{ store.isFetchingComments ? 'Fetching...' : 'Fetch comments' }}
        </button>
      </div>

      <p class="text-text-muted mb-6">
        Find comments that ask where to buy, discount codes, or show purchase intent. These viewers could become customers.
      </p>

      <div v-if="store.isFetchingComments" class="mb-6">
        <p class="text-text-muted">Scanning comments across your videos...</p>
        <div class="mt-3 h-1.5 rounded-full bg-border-default overflow-hidden">
          <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/2" />
        </div>
      </div>

      <div v-else-if="store.highIntentComments.length > 0" class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm font-medium text-text-muted">Show:</span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="showFilter === 'unanswered' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-border-default text-text-muted hover:bg-filter-bg'"
            @click="showFilter = 'unanswered'"
          >
            Unanswered ({{ unansweredCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-button text-sm font-medium transition-all border"
            :class="showFilter === 'all' ? 'bg-filter-bg-active border-filter-border-active text-filter-text-active' : 'bg-card-bg border-border-default text-text-muted hover:bg-filter-bg'"
            @click="showFilter = 'all'"
          >
            All ({{ store.highIntentComments.length }})
          </button>
          <button
            v-if="tier.tier.value === 'pro' && selectedReplyableCount > 0"
            type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from/20 to-btn-to/20 border border-btn-from/40 text-btn-from hover:opacity-90"
            :disabled="replying"
            @click="replyModalOpen = true"
          >
            Reply to selected ({{ selectedCount }})
          </button>
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
            :class="{ 'border-merch-border text-merch-link': exportSuccess }"
            @click="exportToCsv"
          >
            {{ exportSuccess ? 'Exported!' : 'Export to CSV' }}
          </button>
        </div>
        <div
          v-for="c in displayedComments"
          :key="c.id"
          class="rounded-card p-4 bg-card-bg border border-border-default flex flex-col sm:flex-row sm:items-center gap-3"
          :class="{ 'opacity-60': isAnswered(c.id) }"
        >
          <div v-if="tier.tier.value === 'pro'" class="flex-shrink-0">
            <input
              :id="`sel-${c.id}`"
              type="checkbox"
              :checked="selectedIds.has(c.id)"
              :disabled="c.canReply === false"
              class="rounded border-border-default"
              :title="c.canReply === false ? 'Replies disabled for this comment' : undefined"
              @change="toggleSelect(c.id)"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-text-primary">{{ c.text }}</p>
            <p class="text-xs text-text-muted mt-1">
              {{ c.authorDisplayName }} · {{ c.videoTitle }}
            </p>
          </div>
          <div class="flex flex-shrink-0 gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium transition-colors"
              :class="isAnswered(c.id) ? 'bg-merch-bg border border-merch-border text-merch-link' : 'bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention'"
              @click="store.markCommentAsAnswered(c.id, !isAnswered(c.id))"
            >
              {{ isAnswered(c.id) ? 'Answered' : 'Mark as answered' }}
            </button>
            <button
              v-if="tier.tier.value === 'pro'"
              type="button"
              class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-muted hover:bg-card-bg-attention"
              @click="store.markCommentAsWrong(c.id, true)"
            >
              Mark as wrong
            </button>
            <a
              :href="c.permalink"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
            >
              Reply on YouTube
            </a>
          </div>
        </div>
        <Teleport to="body">
          <div v-if="replyModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="replyModalOpen = false">
            <div class="rounded-card p-6 bg-card-bg border border-border-default max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 class="text-lg font-semibold text-text-primary mb-3">Reply to {{ selectedCount }} comment(s)</h3>
              <p class="text-sm text-text-muted mb-3">Use <code class="px-1 py-0.5 rounded bg-card-bg-attention">&#123;&#123;author&#125;&#125;</code> to insert the commenter's name.</p>
              <textarea
                v-model="replyTemplate"
                rows="4"
                placeholder="Thanks {{author}}! Here's the link: ..."
                class="w-full px-4 py-2 rounded-button bg-card-bg border border-border-default text-text-primary placeholder:text-text-muted mb-4"
              />
              <div v-if="replyError" class="rounded-card px-4 py-3 bg-error-bg border border-error-border text-error-text mb-3 flex flex-wrap items-center gap-3">
                <span class="flex-1 min-w-0">{{ replyError }}</span>
                <NuxtLink
                  v-if="isReplyProRequiredError"
                  to="/settings"
                  class="px-3 py-1 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to text-white hover:from-btn-hover-from hover:to-btn-hover-to"
                >
                  Upgrade to Pro
                </NuxtLink>
              </div>
              <div v-if="replySuccess" class="text-sm text-merch-link mb-3">{{ replySuccess }}</div>
              <div class="flex gap-3">
                <button
                  type="button"
                  class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60"
                  :disabled="replying || !replyTemplate.trim()"
                  @click="sendBulkReplies"
                >
                  {{ replying ? 'Replying...' : 'Send' }}
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded-button text-sm font-medium bg-card-bg border border-border-default text-text-primary hover:bg-card-bg-attention"
                  :disabled="replying"
                  @click="replyModalOpen = false"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>

      <div v-else-if="store.hasVideos" class="rounded-card p-8 bg-card-bg border border-border-default text-center">
        <p class="text-text-muted mb-4">Click "Fetch comments" to scan your videos for purchase-intent comments.</p>
        <button
          type="button"
          class="px-6 py-3 rounded-button font-semibold bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to disabled:opacity-60"
          :disabled="store.isFetchingComments"
          @click="store.fetchComments"
        >
          Fetch comments
        </button>
      </div>

      <div v-else class="rounded-card p-8 bg-card-bg border border-border-default text-center">
        <p class="text-text-muted">Run an audit first to load your videos, then fetch comments.</p>
        <NuxtLink
          to="/dashboard"
          class="inline-block mt-4 px-6 py-3 rounded-button font-semibold bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
        >
          Go to Dashboard
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCreatorWorkspaceStore } from '~~/stores/creatorWorkspace'
import { useTier } from '~~/composables/useTier'
import type { HighIntentComment } from '~~/stores/creatorWorkspace'

definePageMeta({
  middleware: 'auth',
  layout: 'creator'
})
useSeoMeta({ title: 'High-Intent Comments | UpScrub' })

const store = useCreatorWorkspaceStore()
const tier = useTier()
const showFilter = ref<'unanswered' | 'all'>('unanswered')
const selectedIds = ref<Set<string>>(new Set())
const replyModalOpen = ref(false)
const replyTemplate = ref('Thanks {{author}}! Here\'s the link: ')
const replyError = ref<string | null>(null)
const replySuccess = ref<string | null>(null)
const replying = ref(false)

const isAnswered = (commentId: string) => store.answeredCommentIds.includes(commentId)

const displayedComments = computed(() => {
  if (showFilter.value === 'all') return store.highIntentComments
  return store.highIntentComments.filter((c) => !store.answeredCommentIds.includes(c.id))
})

const unansweredCount = computed(() =>
  store.highIntentComments.filter((c) => !store.answeredCommentIds.includes(c.id)).length
)

const selectedCount = computed(() => selectedIds.value.size)

const selectedReplyableCount = computed(() => {
  let n = 0
  for (const id of selectedIds.value) {
    const c = store.highIntentComments.find((x) => x.id === id)
    if (c && c.canReply !== false) n++
  }
  return n
})

const toggleSelect = (id: string) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

const isReplyProRequiredError = computed(() => {
  const msg = replyError.value?.toLowerCase() ?? ''
  return msg.includes('pro') && (msg.includes('feature') || msg.includes('upgrade'))
})

const selectedCommentsForReply = computed((): HighIntentComment[] => {
  const list: HighIntentComment[] = []
  for (const id of selectedIds.value) {
    const c = store.highIntentComments.find((x) => x.id === id)
    if (c && c.canReply !== false) list.push(c)
  }
  return list
})

const sendBulkReplies = async () => {
  const comments = selectedCommentsForReply.value
  if (comments.length === 0 || !replyTemplate.value.trim()) return
  replyError.value = null
  replySuccess.value = null
  replying.value = true
  try {
    const res = await store.replyToCommentsBulk(
      comments.map((c) => ({ id: c.id, authorDisplayName: c.authorDisplayName, canReply: c.canReply })),
      replyTemplate.value.trim()
    )
    replySuccess.value = `Replied to ${res.replied} comment(s).`
    selectedIds.value = new Set()
    setTimeout(() => {
      replyModalOpen.value = false
      replySuccess.value = null
    }, 1500)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    replyError.value = err?.data?.message ?? err?.message ?? 'Failed to send replies'
  } finally {
    replying.value = false
  }
}

function escapeCsvValue(text: string): string {
  const escaped = text.replace(/"/g, '""')
  return `"${escaped}"`
}

const exportSuccess = ref(false)
const exportToCsv = () => {
  if (store.highIntentComments.length === 0) return
  const header = 'text'
  const rows = store.highIntentComments.map((c) => escapeCsvValue(c.text))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `high-intent-comments-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  exportSuccess.value = true
  setTimeout(() => { exportSuccess.value = false }, 2500)
}

onMounted(() => {
  store.loadCommentsFromCache()
})
</script>
