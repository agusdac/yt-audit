import type { LinkCheckResult } from '~~/types/links'
import { getLinksToCheck } from '~~/utils/url'
import { runLinkCheck } from '../service/linkCheckService'
import { getRevenueLossForLink } from '~~/utils/revenue'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = getHeader(event, 'x-scheduled-audit-secret')
  if (!config.scheduledAuditSecret || secret !== config.scheduledAuditSecret) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const channels = config.scheduledAuditChannels as string[]
  if (!channels.length) {
    return { ok: true, message: 'No channels configured', count: 0, videos: [] }
  }

  const { runAudit } = await import('../utils/runAudit')
  const res = await runAudit(channels, config.ytApiKey)
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
  let totalRevenueLoss = 0
  for (const r of deadLinks) {
    const { revenueLoss } = getRevenueLossForLink(r, videos)
    totalRevenueLoss += revenueLoss
  }

  const notificationEmail = config.notificationEmail as string
  if (notificationEmail && deadLinks.length > 0) {
    const { sendDeadLinksAlert } = await import('../service/emailService')
    try {
      await sendDeadLinksAlert(notificationEmail, {
        channels,
        deadLinksCount: deadLinks.length,
        totalRevenueLoss,
        deadLinks: deadLinks.map((r) => ({
          url: r.url,
          videoCount: r.videoIds?.length ?? 0
        }))
      })
    } catch {
      // ignore email errors
    }
  }

  const webhookUrl = config.auditWebhookUrl as string
  if (webhookUrl && res.count > 0) {
    try {
      await $fetch(webhookUrl, {
        method: 'POST',
        body: {
          event: 'audit_complete',
          count: res.count,
          channels,
          timestamp: new Date().toISOString(),
          deadLinks: deadLinks.map((r) => ({
            url: r.url,
            videoIds: r.videoIds,
            videoCount: r.videoIds?.length ?? 0
          })),
          deadLinksCount: deadLinks.length,
          totalRevenueLoss: Math.round(totalRevenueLoss * 100) / 100,
          linkResultsSummary: {
            dead: deadLinks.length,
            redirected: linkResults.filter((r) => r.category === 'redirected').length,
            ok: linkResults.filter((r) => r.category === 'ok').length
          }
        }
      })
    } catch {
      // ignore webhook errors
    }
  }

  try {
    const { saveAuditHistoryWithLinks } = await import('../service/auditHistoryService')
    await saveAuditHistoryWithLinks(channels, videos, linkResults)
  } catch {
    // ignore
  }

  return {
    ok: true,
    count: res.count,
    videos: res.videos,
    deadLinksCount: deadLinks.length,
    totalRevenueLoss: Math.round(totalRevenueLoss * 100) / 100,
    linkResults
  }
})
