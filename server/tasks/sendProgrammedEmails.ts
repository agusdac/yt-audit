import type { LinkCheckResult } from '~~/types/links'
import { getLinksToCheck } from '~~/utils/url'
import { getRevenueLossForLink } from '~~/utils/revenue'
import { getUsersDueForScheduledAudit, setLastScheduledAuditAt } from '~~/server/service/creatorSettingsService'
import { getLinkedChannels } from '~~/server/service/userService'
import { getUserById } from '~~/server/service/userService'
import { runAudit } from '~~/server/utils/runAudit'
import { runLinkCheck } from '~~/server/service/linkCheckService'
import { sendDeadLinksAlert } from '~~/server/service/emailService'
import { getCreatorSettings } from '~~/server/service/creatorSettingsService'
import { saveAuditHistoryWithLinks } from '~~/server/service/auditHistoryService'
import { getEffectiveTier } from '~~/server/service/tierService'

export default defineTask({
  meta: {
    name: 'sendProgrammedEmails',
    description: 'Run scheduled audits for users and email dead-link alerts'
  },
  async run({ payload }) {
    const config = useRuntimeConfig()
    const ytApiKey = config.ytApiKey as string
    if (!ytApiKey) {
      return { result: { ok: false, error: 'YT_API_KEY not configured', processed: 0 } }
    }

    const due = await getUsersDueForScheduledAudit()
    const results: Array<{ userId: string; email: string; channels: string[]; deadLinks: number; emailed: boolean }> = []

    for (const { userId } of due) {
      const tier = await getEffectiveTier(userId)
      if (tier !== 'pro') continue

      const user = await getUserById(userId)
      if (!user?.email) continue

      const channels = await getLinkedChannels(userId)
      const handles = channels.map((c) => c.handle).filter(Boolean)
      if (handles.length === 0) continue

      try {
        const res = await runAudit(handles, ytApiKey)
        const videos = res.videos

        const urlToVideoIds = new Map<string, string[]>()
        for (const video of videos) {
          for (const url of getLinksToCheck(video.links)) {
            const existing = urlToVideoIds.get(url) ?? []
            if (!existing.includes(video.id)) {
              existing.push(video.id)
              urlToVideoIds.set(url, existing)
            }
          }
        }
        const checks = [...urlToVideoIds.entries()].map(([url, videoIds]) => ({ url, videoIds }))

        let linkResults: LinkCheckResult[] = []
        if (checks.length > 0) {
          linkResults = await runLinkCheck(checks)
        }

        const deadLinks = linkResults.filter((r) => r.category === 'dead')
        const creatorSettings = await getCreatorSettings(userId)
        let totalRevenueLoss = 0
        for (const r of deadLinks) {
          const { revenueLoss } = getRevenueLossForLink(r, videos, {
            userSponsors: creatorSettings?.sponsorDomains ?? [],
            creatorSettings: creatorSettings ?? undefined
          })
          totalRevenueLoss += revenueLoss
        }

        let emailed = false
        if (deadLinks.length > 0) {
          try {
            emailed = await sendDeadLinksAlert(user.email, {
              channels: handles,
              deadLinksCount: deadLinks.length,
              totalRevenueLoss,
              deadLinks: deadLinks.map((r) => ({
                url: r.url,
                videoCount: r.videoIds?.length ?? 0
              })),
              siteUrl: String(config.public?.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || '')
            })
          } catch {
            // ignore
          }
        }

        try {
          await saveAuditHistoryWithLinks(handles, videos, linkResults)
        } catch {
          // ignore
        }

        await setLastScheduledAuditAt(userId)
        results.push({
          userId,
          email: user.email,
          channels: handles,
          deadLinks: deadLinks.length,
          emailed
        })
      } catch (err) {
        console.error(`[sendProgrammedEmails] User ${userId}:`, err)
      }
    }

    return {
      result: {
        ok: true,
        error: '',
        processed: results.length,
        scheduledTime: payload?.scheduledTime,
        results
      }
    } as { result: { ok: boolean; error: string; processed: number; scheduledTime?: unknown; results?: Array<{ userId: string; email: string; channels: string[]; deadLinks: number; emailed: boolean }> } }
  }
})
