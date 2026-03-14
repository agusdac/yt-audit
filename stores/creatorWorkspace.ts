import { defineStore } from 'pinia'
import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'

type MeData = {
  user: { id: string; email: string; name?: string; avatarUrl?: string }
  linkedChannels: Array<{ id: number; channelId: string; handle: string; channelTitle?: string }>
}

export const useCreatorWorkspaceStore = defineStore('creatorWorkspace', {
  state: () => ({
    videos: [] as VideoDetails[],
    linkResults: [] as LinkCheckResult[],
    lastAuditAt: null as Date | null,
    isLoading: false,
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

    clearError() {
      this.error = null
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
