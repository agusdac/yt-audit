import { defineStore } from 'pinia'
import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import type { HighIntentComment } from '~~/stores/creatorWorkspace'
import { getLinksToCheck } from '~~/utils/url'

export const useAdminAuditStore = defineStore('adminAudit', {
  state: () => ({
    videos: [] as VideoDetails[],
    linkResults: [] as LinkCheckResult[],
    highIntentComments: [] as HighIntentComment[],
    hasCommentsLoaded: false,
    lastAuditAt: null as Date | null,
    channelHandles: [] as string[],
    isLoading: false,
    isCheckingLinks: false,
    isFetchingComments: false,
    error: null as string | null
  }),

  getters: {
    deadLinksCount: (state) => state.linkResults.filter((r) => r.category === 'dead').length,
    hasVideos: (state) => state.videos.length > 0,
    hasDeadLinks: (state) => state.linkResults.some((r) => r.category === 'dead')
  },

  actions: {
    setChannelHandles(handles: string[]) {
      this.channelHandles = handles
    },

    async runAudit(handles: string[]) {
      const normalized = handles.map((h) => h.trim().replace(/^@/, '')).filter(Boolean)
      if (normalized.length === 0) return

      this.channelHandles = normalized
      this.isLoading = true
      this.error = null
      this.videos = []
      this.linkResults = []

      try {
        const response = await $fetch<{ count: number; videos: VideoDetails[] }>('/api/audit', {
          method: 'POST',
          body: { handles: normalized }
        })
        this.videos = response.videos
        this.lastAuditAt = new Date()
      } catch (e: unknown) {
        const err = e as { data?: { message?: string }; message?: string }
        this.error = err?.data?.message ?? err?.message ?? 'Failed to run audit.'
      } finally {
        this.isLoading = false
      }
    },

    async runLinkCheck() {
      if (this.videos.length === 0) return

      const urlToVideoIds = new Map<string, string[]>()
      for (const video of this.videos) {
        for (const url of getLinksToCheck(video.links)) {
          const existing = urlToVideoIds.get(url) ?? []
          if (!existing.includes(video.id)) {
            existing.push(video.id)
            urlToVideoIds.set(url, existing)
          }
        }
      }
      const checks = [...urlToVideoIds.entries()].map(([url, videoIds]) => ({ url, videoIds }))
      if (checks.length === 0) return

      this.isCheckingLinks = true
      this.error = null
      try {
        const res = await $fetch<{ linkResults: LinkCheckResult[] }>('/api/check-links', {
          method: 'POST',
          body: { checks }
        })
        this.linkResults = res.linkResults ?? []
      } catch (e: unknown) {
        const err = e as { data?: { message?: string }; message?: string }
        this.error = err?.data?.message ?? err?.message ?? 'Link check failed.'
      } finally {
        this.isCheckingLinks = false
      }
    },

    clearError() {
      this.error = null
    },

    async loadCommentsFromCache() {
      if (this.channelHandles.length === 0) {
        this.highIntentComments = []
        return
      }
      try {
        const handles = this.channelHandles.join(',')
        const res = await $fetch<{ highIntentComments: HighIntentComment[] }>(
          `/api/admin/comments?handles=${encodeURIComponent(handles)}`
        )
        this.highIntentComments = res.highIntentComments ?? []
        this.hasCommentsLoaded = true
      } catch {
        this.highIntentComments = []
      }
    },

    async fetchComments() {
      if (this.videos.length === 0 || this.channelHandles.length === 0) return

      this.isFetchingComments = true
      this.error = null
      try {
        const res = await $fetch<{ highIntentComments: HighIntentComment[] }>('/api/admin/comments.fetch', {
          method: 'POST',
          body: {
            videos: this.videos.map((v) => ({ id: v.id, title: v.title })),
            handles: this.channelHandles
          }
        })
        this.highIntentComments = res.highIntentComments ?? []
        this.hasCommentsLoaded = true
      } catch (e: unknown) {
        const err = e as { data?: { message?: string }; message?: string }
        this.error = err?.data?.message ?? err?.message ?? 'Failed to fetch comments.'
      } finally {
        this.isFetchingComments = false
      }
    }
  }
})
