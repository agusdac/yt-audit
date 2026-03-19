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
  canReply?: boolean
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
    answeredCommentIds: [] as string[],
    wrongCommentIds: [] as string[],
    hasCommentsLoaded: false,
    lastAuditAt: null as Date | null,
    isLoading: false,
    isCheckingLinks: false,
    isFetchingComments: false,
    error: null as string | null,
    errorCode: null as string | null,
    me: null as MeData | null,
    creatorSettings: null as { cpmSponsor?: number; ctrAffiliate?: number; convAffiliate?: number; avgCommission?: number; sponsorDomains?: string[]; scheduledAuditEnabled?: boolean; scheduledAuditFrequency?: 'weekly' | 'monthly' } | null
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
      this.errorCode = null
      this.videos = []
      this.linkResults = []
      this.highIntentComments = []
      this.hasCommentsLoaded = false

      try {
        const response = await $fetch<{
          count: number
          videos: VideoDetails[]
          linkResults?: LinkCheckResult[]
          highIntentComments?: HighIntentComment[]
        }>('/api/audit', {
          method: 'POST',
          body: { handles: channels.map((c) => c.handle) }
        })
        this.videos = response.videos
        this.linkResults = response.linkResults ?? []
        this.highIntentComments = response.highIntentComments ?? []
        this.hasCommentsLoaded = true
        this.lastAuditAt = new Date()
      } catch (e: unknown) {
        const err = e as { data?: { message?: string; code?: string }; message?: string }
        this.error = err?.data?.message ?? err?.message ?? 'Failed to run audit.'
        this.errorCode = err?.data?.code ?? null
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
        const data = await $fetch<{ cached: boolean; videos: VideoDetails[]; linkResults: LinkCheckResult[]; cachedAt?: number }>(
          '/api/audit-cache'
        )
        if (data.cached && data.videos.length > 0) {
          this.videos = data.videos
          this.linkResults = data.linkResults ?? []
          this.lastAuditAt = data.cachedAt ? new Date(data.cachedAt * 1000) : new Date()
          return true
        }
      } catch {
        // ignore
      }
      return false
    },

    clearError() {
      this.error = null
      this.errorCode = null
    },

    async loadCommentsFromCache() {
      try {
        const res = await $fetch<{ highIntentComments: HighIntentComment[]; answeredCommentIds?: string[]; wrongCommentIds?: string[] }>('/api/comments')
        this.highIntentComments = res.highIntentComments ?? []
        this.answeredCommentIds = res.answeredCommentIds ?? []
        this.wrongCommentIds = res.wrongCommentIds ?? []
        this.hasCommentsLoaded = true
      } catch {
        this.highIntentComments = []
        this.answeredCommentIds = []
        this.wrongCommentIds = []
      }
    },

    async fetchComments() {
      if (this.videos.length === 0) return

      this.isFetchingComments = true
      this.error = null
      try {
        const res = await $fetch<{ highIntentComments: HighIntentComment[]; answeredCommentIds?: string[]; wrongCommentIds?: string[] }>('/api/comments.fetch', {
          method: 'POST',
          body: {
            videos: this.videos.map((v) => ({ id: v.id, title: v.title }))
          }
        })
        this.highIntentComments = res.highIntentComments ?? []
        this.answeredCommentIds = res.answeredCommentIds ?? []
        this.wrongCommentIds = res.wrongCommentIds ?? []
        this.hasCommentsLoaded = true
      } catch (e: unknown) {
        const err = e as { data?: { message?: string }; message?: string }
        this.error = err?.data?.message ?? err?.message ?? 'Failed to fetch comments.'
      } finally {
        this.isFetchingComments = false
      }
    },

    async markCommentAsAnswered(commentId: string, answered: boolean) {
      try {
        const res = await $fetch<{ answeredCommentIds: string[] }>('/api/comments.mark-answered', {
          method: 'POST',
          body: { commentId, answered }
        })
        this.answeredCommentIds = res.answeredCommentIds ?? []
      } catch {
        // ignore
      }
    },

    async replyToCommentsBulk(comments: Array<{ id: string; authorDisplayName: string; canReply?: boolean }>, template: string) {
      const res = await $fetch<{ replied: number; repliedIds: string[] }>('/api/comments/reply-bulk', {
        method: 'POST',
        body: { comments, template }
      })
      for (const id of res.repliedIds ?? []) {
        if (!this.answeredCommentIds.includes(id)) this.answeredCommentIds.push(id)
      }
      return res
    },

    async markCommentAsWrong(commentId: string, wrong: boolean) {
      try {
        await $fetch('/api/comments/mark-wrong', {
          method: 'POST',
          body: { commentId, wrong }
        })
        if (wrong) {
          this.highIntentComments = this.highIntentComments.filter((c) => c.id !== commentId)
          if (!this.wrongCommentIds.includes(commentId)) this.wrongCommentIds.push(commentId)
        } else {
          this.wrongCommentIds = this.wrongCommentIds.filter((id) => id !== commentId)
        }
      } catch {
        // ignore
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
    },

    async loadCreatorSettings() {
      try {
        const res = await $fetch<{ settings: { cpmSponsor?: number; ctrAffiliate?: number; convAffiliate?: number; avgCommission?: number; sponsorDomains?: string[]; scheduledAuditEnabled?: boolean; scheduledAuditFrequency?: 'weekly' | 'monthly' } }>('/api/settings')
        this.creatorSettings = res.settings && Object.keys(res.settings).length > 0 ? res.settings : null
      } catch {
        this.creatorSettings = null
      }
    },

    async saveCreatorSettings(settings: { cpmSponsor?: number; ctrAffiliate?: number; convAffiliate?: number; avgCommission?: number; sponsorDomains?: string[]; scheduledAuditEnabled?: boolean; scheduledAuditFrequency?: 'weekly' | 'monthly' }): Promise<boolean> {
      try {
        await $fetch('/api/settings', { method: 'POST', body: settings })
        this.creatorSettings = this.creatorSettings ? { ...this.creatorSettings, ...settings } : settings
        this.error = null
        return true
      } catch (e: unknown) {
        const err = e as { data?: { message?: string }; message?: string }
        this.error = err?.data?.message ?? err?.message ?? 'Failed to save settings'
        return false
      }
    }
  }
})
