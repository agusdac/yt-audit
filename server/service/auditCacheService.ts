import { createHash } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import { db } from '~~/server/db'
import { auditCache } from '~~/server/db/schemas/auditCache'

function getHandlesHash(handles: string[]): string {
  const sorted = [...handles].map((h) => h.trim().toLowerCase()).sort()
  return createHash('sha256').update(sorted.join(',')).digest('hex')
}

export async function getCachedAudit(
  userId: string,
  handles: string[],
  ttlHours: number
): Promise<{ videos: VideoDetails[]; linkResults: LinkCheckResult[] } | null> {
  const handlesHash = getHandlesHash(handles)
  const minCachedAt = Math.floor(Date.now() / 1000) - ttlHours * 60 * 60

  const row = await db.query.auditCache.findFirst({
    where: and(eq(auditCache.userId, userId), eq(auditCache.handlesHash, handlesHash)),
    columns: { videos: true, linkResults: true, cachedAt: true }
  })

  if (!row || row.cachedAt < minCachedAt) return null

  return {
    videos: row.videos as VideoDetails[],
    linkResults: row.linkResults as LinkCheckResult[]
  }
}

export async function setCachedAudit(
  userId: string,
  handles: string[],
  videos: VideoDetails[],
  linkResults: LinkCheckResult[]
) {
  const handlesHash = getHandlesHash(handles)
  const cachedAt = Math.floor(Date.now() / 1000)

  await db
    .insert(auditCache)
    .values({
      userId,
      handlesHash,
      videos: JSON.parse(JSON.stringify(videos)),
      linkResults: JSON.parse(JSON.stringify(linkResults)),
      cachedAt
    })
    .onConflictDoUpdate({
      target: [auditCache.userId, auditCache.handlesHash],
      set: {
        videos: JSON.parse(JSON.stringify(videos)),
        linkResults: JSON.parse(JSON.stringify(linkResults)),
        cachedAt
      }
    })
}
