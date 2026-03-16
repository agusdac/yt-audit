import { eq } from 'drizzle-orm'
import type { VideoScoreResult } from '~~/utils/videoScore'
import type { ChannelScoreResult } from '~~/utils/channelScore'
import { db } from '~~/server/db'
import { videoScoreCache, channelScoreCache } from '~~/server/db/schemas/scoreCache'

const DEFAULT_TTL_HOURS = 24

const normalizeHandle = (h: string): string => h.trim().replace(/^@/, '').toLowerCase()

export const getCachedVideoScore = async (
  videoId: string,
  ttlHours = DEFAULT_TTL_HOURS
): Promise<VideoScoreResult | null> => {
  const minCachedAt = Math.floor(Date.now() / 1000) - ttlHours * 60 * 60
  const row = await db.query.videoScoreCache.findFirst({
    where: eq(videoScoreCache.videoId, videoId),
    columns: { result: true, cachedAt: true }
  })
  if (!row || row.cachedAt < minCachedAt) return null
  return row.result as VideoScoreResult
}

export const setCachedVideoScore = async (videoId: string, result: VideoScoreResult) => {
  const cachedAt = Math.floor(Date.now() / 1000)
  await db
    .insert(videoScoreCache)
    .values({ videoId, result: JSON.parse(JSON.stringify(result)), cachedAt })
    .onConflictDoUpdate({
      target: videoScoreCache.videoId,
      set: { result: JSON.parse(JSON.stringify(result)), cachedAt }
    })
}

export const getCachedChannelScore = async (
  handle: string,
  ttlHours = DEFAULT_TTL_HOURS
): Promise<{ channelScore: ChannelScoreResult; channelHandle: string } | null> => {
  const key = normalizeHandle(handle)
  const minCachedAt = Math.floor(Date.now() / 1000) - ttlHours * 60 * 60
  const row = await db.query.channelScoreCache.findFirst({
    where: eq(channelScoreCache.handle, key),
    columns: { result: true, cachedAt: true }
  })
  if (!row || row.cachedAt < minCachedAt) return null
  return row.result as { channelScore: ChannelScoreResult; channelHandle: string }
}

export const setCachedChannelScore = async (
  handle: string,
  data: { channelScore: ChannelScoreResult; channelHandle: string }
) => {
  const key = normalizeHandle(handle)
  const cachedAt = Math.floor(Date.now() / 1000)
  await db
    .insert(channelScoreCache)
    .values({ handle: key, result: JSON.parse(JSON.stringify(data)), cachedAt })
    .onConflictDoUpdate({
      target: channelScoreCache.handle,
      set: { result: JSON.parse(JSON.stringify(data)), cachedAt }
    })
}
