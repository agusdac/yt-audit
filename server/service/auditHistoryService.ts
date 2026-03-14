import { desc } from 'drizzle-orm'
import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import { db } from '~~/server/db'
import { auditHistory } from '~~/server/db/schemas/auditHistory'
import { getRevenueLossForLink } from '~~/utils/revenue'

export async function saveAuditHistory(handle: string, videoCount: number, options?: { deadLinksCount?: number; revenueLoss?: number }) {
  const createdAt = Math.floor(Date.now() / 1000)
  await db.insert(auditHistory).values({
    handle,
    videoCount,
    deadLinksCount: options?.deadLinksCount ?? null,
    revenueLoss: options?.revenueLoss ?? null,
    createdAt
  })
}

export async function saveAuditHistoryWithLinks(
  handles: string[],
  videos: VideoDetails[],
  linkResults: LinkCheckResult[]
) {
  const deadLinks = linkResults.filter((r) => r.category === 'dead')
  const createdAt = Math.floor(Date.now() / 1000)

  for (const handle of handles) {
    const handleVideos = videos.filter((v) => v.channelHandle === handle)
    const videoIds = new Set(handleVideos.map((v) => v.id))
    const handleDeadLinks = deadLinks.filter((r) => (r.videoIds ?? []).some((id) => videoIds.has(id)))
    let revenueLoss = 0
    for (const r of handleDeadLinks) {
      const { revenueLoss: rl } = getRevenueLossForLink(r, videos)
      revenueLoss += rl
    }
    await db.insert(auditHistory).values({
      handle,
      videoCount: handleVideos.length,
      deadLinksCount: handleDeadLinks.length,
      revenueLoss: revenueLoss > 0 ? revenueLoss : null,
      createdAt
    })
  }
}

export async function getAuditHistory(limit = 50) {
  const rows = await db.query.auditHistory.findMany({
    orderBy: desc(auditHistory.createdAt),
    limit
  })
  return rows.map(r => ({
    id: r.id,
    handle: r.handle,
    videoCount: r.videoCount,
    deadLinksCount: r.deadLinksCount ?? undefined,
    revenueLoss: r.revenueLoss ?? undefined,
    createdAt: new Date(r.createdAt * 1000).toISOString()
  }))
}
