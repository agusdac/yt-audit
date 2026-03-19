import { getAccessToken } from '../service/googleAuthService'
import { getEffectiveTier } from '../service/tierService'
import { updateVideoDescription } from '../service/youtubeService'

const DELAY_MS = 300

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const tier = await getEffectiveTier(userId)
  if (tier !== 'pro') {
    throw createError({
      statusCode: 403,
      message: 'Bulk link update is a Pro feature. Upgrade to Pro to use it.',
      data: { code: 'PRO_REQUIRED' }
    })
  }

  const config = useRuntimeConfig(event)
  const { checkRateLimit } = await import('../utils/rateLimit')
  const rl = checkRateLimit(
    `bulk-links:${userId}`,
    config.bulkLinksRateLimitPerMin ?? 5
  )
  if (!rl.ok) {
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded. Retry after ${rl.retryAfter ?? 60} seconds.`
    })
  }

  const body = await readBody<{ videoIds: string[]; oldUrl: string; newUrl: string }>(event)
  const videoIds = body?.videoIds
  const oldUrl = typeof body?.oldUrl === 'string' ? body.oldUrl.trim() : ''
  const newUrl = typeof body?.newUrl === 'string' ? body.newUrl.trim() : ''

  if (!Array.isArray(videoIds) || videoIds.length === 0 || !oldUrl || !newUrl) {
    throw createError({
      statusCode: 400,
      message: 'videoIds (non-empty array), oldUrl, and newUrl are required'
    })
  }

  const accessToken = await getAccessToken(userId)

  const updated: string[] = []
  const failed: Array<{ videoId: string; error: string }> = []

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = String(videoIds[i]).trim()
    if (!videoId) continue

    try {
      const { getVideoSnippet } = await import('../service/youtubeService')
      const snippet = await getVideoSnippet(videoId, accessToken)
      const currentDesc = snippet.description ?? ''
      if (!currentDesc.includes(oldUrl)) {
        failed.push({ videoId, error: 'Old URL not found in description' })
        continue
      }
      const newDesc = currentDesc.replaceAll(oldUrl, newUrl)
      await updateVideoDescription(videoId, newDesc, accessToken)
      updated.push(videoId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      failed.push({ videoId, error: msg })
    }

    if (i < videoIds.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  return { updated: updated.length, failed, updatedIds: updated }
})
