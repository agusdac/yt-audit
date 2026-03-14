import { defineStore } from 'pinia'
import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import { getLinksToCheck } from '~~/utils/url'

export interface HighIntentComment {
  id: string
  videoId: string
  videoTitle: string
  text: string
  authorDisplayName: string
  publishedAt: string
  permalink: string
}

type MeData = {
  user: { id: string; email: string; name?: string; avatarUrl?: string }
  linkedChannels: Array<{ id: number; channelId: string; handle: string; channelTitle?: string }>
}

export const useCreatorWorkspaceStore = defineStore('creatorWorkspace', {
  state: () => ({
    videos: [] as VideoDetails[],
    linkResults: [] as LinkCheckResult[],
    highIntentComments: [] as HighIntentComment[],
    hasCommentsLoaded: false,
    lastAuditAt: null as Date | null,
    isLoading: false,
    isCheckingLinks: false,
    isFetchingComments: false,
    error: null as string | null,
    me: null as MeData | null
  }),

  getters: {
    deadLinksCount: (state) => state.linkResults.filter((r) => r.category === 'dead').length,
    hasVideos: (state) => state.videos.length > 0,
    hasDeadLinks: (state) => state.linkResults.some((r) => r.category === 'dead'),
    firstChannel: (state) => state.me?.linkedChannels?.[0] ?? null
  },

  actions: {
    setMe(data: MeData | null) {
      this.me = data
    },

    setLinkResults(results: LinkCheckResult[]) {
      this.linkResults = results
    },

    async runAudit() {
      const channels = this.me?.linkedChannels
      if (!channels?.length) return

      this.isLoading = true
      this.error = null
      this.videos = []
      this.linkResults = []

      try {
        const response = await $fetch<{ count: number; videos: VideoDetails[] }>('/api/audit', {
          method: 'POST',
          body: { handles: channels.map((c) => c.handle) }
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

    async loadFromCache() {
      const channels = this.me?.linkedChannels
      if (!channels?.length) return null

      try {
        const data = await $fetch<{ cached: boolean; videos: VideoDetails[]; linkResults: LinkCheckResult[] }>(
          '/api/audit-cache'
        )
        if (data.cached && data.videos.length > 0) {
          this.videos = data.videos
          this.linkResults = data.linkResults ?? []
          this.lastAuditAt = new Date()
          return true
        }
      } catch {
        // ignore
      }
      return false
    },

    clearError() {
      this.error = null
    },

    async loadCommentsFromCache() {
      try {
        const res = await $fetch<{ highIntentComments: HighIntentComment[] }>('/api/comments')
        this.highIntentComments = res.highIntentComments ?? []
        this.hasCommentsLoaded = true
      } catch {
        this.highIntentComments = []
      }
    },

    async fetchComments() {
      if (this.videos.length === 0) return

      this.isFetchingComments = true
      this.error = null
      try {
        const res = await $fetch<{ highIntentComments: HighIntentComment[] }>('/api/comments.fetch', {
          method: 'POST',
          body: {
            videos: this.videos.map((v) => ({ id: v.id, title: v.title }))
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
    },

    async fetchMe() {
      try {
        const data = await $fetch<MeData>('/api/auth/me')
        this.me = data
        return data
      } catch {
        this.me = null
        return null
      }
    }
  }
})
