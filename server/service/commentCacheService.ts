import { createHash } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import type { YouTubeComment } from './commentService'
import { db } from '~~/server/db'
import { commentCache } from '~~/server/db/schemas/commentCache'

const COMMENT_CACHE_TTL_HOURS = 24

function getHandlesHash(handles: string[]): string {
  const sorted = [...handles].map((h) => h.trim().toLowerCase()).sort()
  return createHash('sha256').update(sorted.join(',')).digest('hex')
}

export async function getCachedComments(
  userId: string,
  handles: string[],
  ttlHours = COMMENT_CACHE_TTL_HOURS
): Promise<YouTubeComment[] | null> {
  const handlesHash = getHandlesHash(handles)
  const minCachedAt = Math.floor(Date.now() / 1000) - ttlHours * 60 * 60

  const row = await db.query.commentCache.findFirst({
    where: and(eq(commentCache.userId, userId), eq(commentCache.handlesHash, handlesHash)),
    columns: { comments: true, cachedAt: true }
  })

  if (!row || row.cachedAt < minCachedAt) return null

  return row.comments as unknown as YouTubeComment[]
}

export async function setCachedComments(
  userId: string,
  handles: string[],
  comments: YouTubeComment[]
) {
  const handlesHash = getHandlesHash(handles)
  const cachedAt = Math.floor(Date.now() / 1000)

  await db
    .insert(commentCache)
    .values({
      userId,
      handlesHash,
      comments: JSON.parse(JSON.stringify(comments)),
      cachedAt
    })
    .onConflictDoUpdate({
      target: [commentCache.userId, commentCache.handlesHash],
      set: {
        comments: JSON.parse(JSON.stringify(comments)),
        cachedAt
      }
    })
}
