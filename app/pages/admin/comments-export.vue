<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="error"
      class="rounded-card px-4 py-3 flex items-center gap-3 bg-error-bg border border-error-border text-error-text mb-6">
      <span class="text-2xl">&#9888;</span>
      <span>{{ error }}</span>
      <button type="button" class="ml-auto px-3 py-1 rounded-button text-sm" @click="error = null">Dismiss</button>
    </div>

    <h1 class="text-2xl font-bold text-text-primary mb-2">Export Comments</h1>
    <p class="text-text-muted mb-6">
      Fetch up to 200 raw comments from videos of the given channels and export them to CSV (text only).
    </p>

    <div class="rounded-card p-6 bg-card-bg border border-border-default mb-6">
      <h2 class="font-semibold text-text-primary mb-4">Channel handles</h2>
      <div class="flex items-center gap-4 mb-4">
        <label class="flex items-center gap-2">
          <input v-model="highIntentOnly" type="checkbox" class="rounded" />
          <span class="text-sm text-text-primary">High-intent only</span>
        </label>
      </div>
      <div class="flex flex-wrap gap-2 p-3 rounded-card bg-filter-bg border border-border-default mb-4">
        <span
          v-for="h in handles"
          :key="h"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary"
        >
          @{{ h }}
          <button type="button" class="hover:text-error-text transition-colors -mr-0.5" aria-label="Remove" @click="removeHandle(h)">
            ×
          </button>
        </span>
        <input
          ref="inputRef"
          v-model="inputValue"
          type="text"
          placeholder="Add channel (@handle)"
          class="flex-1 min-w-[140px] px-2 py-1.5 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-sm"
          @keydown.enter.prevent="addHandle"
          @keydown.comma.prevent="addHandle"
        />
      </div>
      <button
        type="button"
        class="px-6 py-3 rounded-button font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-btn-from to-btn-to shadow-btn hover:from-btn-hover-from hover:to-btn-hover-to"
        :disabled="isFetching || handles.length === 0"
        @click="fetchComments"
      >
        {{ isFetching ? 'Fetching...' : 'Fetch comments' }}
      </button>
    </div>

    <div v-if="isFetching" class="mb-6">
      <p class="text-text-muted">Scanning videos for comments...</p>
      <div class="mt-3 h-1.5 rounded-full bg-border-default overflow-hidden">
        <div class="h-full bg-gradient-to-r from-btn-from to-btn-to animate-pulse w-1/2" />
      </div>
    </div>

    <div v-else-if="comments.length > 0" class="space-y-4">
      <div class="rounded-card p-4 bg-filter-bg border border-border-default space-y-3">
        <h3 class="font-medium text-text-primary">Filters</h3>
        <div class="flex flex-wrap gap-3">
          <input
            v-model="filterKeyword"
            type="text"
            placeholder="Keyword"
            class="px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary w-40"
          />
          <select
            v-model="filterVideoId"
            class="px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary"
          >
            <option value="">All videos</option>
            <option v-for="v in uniqueVideos" :key="v.id" :value="v.id">{{ v.title }}</option>
          </select>
          <input
            v-model="filterDateFrom"
            type="date"
            class="px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary"
          />
          <input
            v-model="filterDateTo"
            type="date"
            class="px-3 py-1.5 rounded-button text-sm bg-card-bg border border-border-default text-text-primary"
          />
        </div>
      </div>
      <div class="flex items-center justify-between flex-wrap gap-4">
        <p class="text-text-muted">{{ displayedComments.length }} comments</p>
        <div class="flex gap-2">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="exportTextOnly" type="checkbox" class="rounded" />
            Text only
          </label>
          <button
            type="button"
            class="px-4 py-2 rounded-button text-sm font-medium bg-gradient-to-r from-btn-from to-btn-to hover:from-btn-hover-from hover:to-btn-hover-to"
            @click="exportToCsv"
          >
            Export to CSV
          </button>
        </div>
      </div>
      <div
        v-for="c in displayedComments"
        :key="c.id"
        class="rounded-card p-4 bg-card-bg border border-border-default"
      >
        <p class="text-sm text-text-primary">{{ c.text }}</p>
        <p class="text-xs text-text-muted mt-1">
          {{ c.authorDisplayName }} · {{ c.videoTitle }}
        </p>
      </div>
    </div>

    <div v-else class="rounded-card p-8 bg-card-bg border border-border-default text-center">
      <p class="text-text-muted">Add channel handles above and click "Fetch comments" to load comments for export.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface YouTubeComment {
  id: string
  videoId: string
  videoTitle: string
  text: string
  authorDisplayName: string
  publishedAt: string
  permalink: string
}

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const handles = ref<string[]>([])
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const comments = ref<YouTubeComment[]>([])
const isFetching = ref(false)
const error = ref<string | null>(null)
const highIntentOnly = ref(false)
const filterKeyword = ref('')
const filterVideoId = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const exportTextOnly = ref(true)

const uniqueVideos = computed(() => {
  const seen = new Set<string>()
  return comments.value.filter((c) => {
    if (seen.has(c.videoId)) return false
    seen.add(c.videoId)
    return true
  }).map((c) => ({ id: c.videoId, title: c.videoTitle }))
})

const displayedComments = computed(() => {
  let list = comments.value
  if (filterKeyword.value.trim()) {
    const k = filterKeyword.value.trim().toLowerCase()
    list = list.filter((c) => c.text.toLowerCase().includes(k))
  }
  if (filterVideoId.value) {
    list = list.filter((c) => c.videoId === filterVideoId.value)
  }
  if (filterDateFrom.value) {
    const from = new Date(filterDateFrom.value).getTime()
    list = list.filter((c) => new Date(c.publishedAt).getTime() >= from)
  }
  if (filterDateTo.value) {
    const to = new Date(filterDateTo.value).getTime() + 86400000
    list = list.filter((c) => new Date(c.publishedAt).getTime() < to)
  }
  return list
})

const normalizeHandle = (h: string) => h.trim().replace(/^@/, '')

const addHandle = () => {
  const h = normalizeHandle(inputValue.value)
  if (h && !handles.value.includes(h)) {
    handles.value.push(h)
    inputValue.value = ''
    inputRef.value?.focus()
  }
}

const removeHandle = (h: string) => {
  handles.value = handles.value.filter((x) => x !== h)
}

const fetchComments = async () => {
  addHandle()
  if (handles.value.length === 0) return

  isFetching.value = true
  error.value = null
  comments.value = []

  try {
    const res = await $fetch<{ comments: YouTubeComment[] }>('/api/admin/comments.fetch-raw', {
      method: 'POST',
      body: { handles: handles.value, highIntentOnly: highIntentOnly.value }
    })
    comments.value = res.comments ?? []
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    error.value = err?.data?.message ?? err?.message ?? 'Failed to fetch comments.'
  } finally {
    isFetching.value = false
  }
}

function escapeCsvValue(text: string): string {
  const escaped = text.replace(/"/g, '""')
  return `"${escaped}"`
}

const exportToCsv = () => {
  if (displayedComments.value.length === 0) return

  const list = displayedComments.value
  let header: string
  let rows: string[]
  if (exportTextOnly.value) {
    header = 'text'
    rows = list.map((c) => escapeCsvValue(c.text))
  } else {
    header = 'text,author,video,permalink'
    rows = list.map((c) =>
      [escapeCsvValue(c.text), escapeCsvValue(c.authorDisplayName), escapeCsvValue(c.videoTitle), escapeCsvValue(c.permalink)].join(',')
    )
  }
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `comments-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
