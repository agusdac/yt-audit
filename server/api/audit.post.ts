import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import type { YouTubeComment } from '~~/server/service/commentService'
import { runAudit } from '../utils/runAudit'
import { getLinkedChannels } from '../service/userService'
import { isAdminSessionValid } from '../utils/adminAuth'
import { getLinksToCheck } from '~~/utils/url'
import { runLinkCheck } from '../service/linkCheckService'
import { getCachedComments, setCachedComments } from '../service/commentCacheService'
import { fetchCommentsForVideo } from '../service/commentService'

const ADMIN_USER_ID = 'admin'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { checkRateLimit } = await import('../utils/rateLimit')
  const { getApiKeyFromEvent } = await import('../utils/apiAuth')
  const apiKey = getApiKeyFromEvent(event)
  const limitKey = apiKey || getRequestIP(event, { xForwardedFor: true }) || 'anon'
  const rl = checkRateLimit(limitKey, Number(config.apiRateLimitPerMin) || 60)
  if (!rl.ok) {
    setResponseStatus(event, 429)
    setHeader(event, 'Retry-After', rl.retryAfter ?? 60)
    throw createError({ statusCode: 429, message: 'Rate limit exceeded' })
  }
  if (apiKey && config.apiKey && apiKey !== config.apiKey) {
    throw createError({ statusCode: 401, message: 'Invalid API key' })
  }

  let handles: string[]
  let userId: string | null = null
  const session = await getUserSession(event)
  const creatorUserId = (session?.user as { id?: string } | undefined)?.id
  const isAdmin = config.adminPassword && isAdminSessionValid(event, config)

  if (creatorUserId) {
    const channels = await getLinkedChannels(creatorUserId)
    handles = channels.map(c => c.handle)
    userId = creatorUserId
    if (handles.length === 0) {
      throw createError({ statusCode: 400, message: 'No YouTube channels linked to your account' })
    }
  } else if (isAdmin || apiKey) {
    const body = await readBody<{ handles: string[] }>(event)
    if (!body?.handles || !Array.isArray(body.handles) || body.handles.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one channel handle is required' })
    }
    handles = body.handles
    if (isAdmin) userId = ADMIN_USER_ID
  } else {
    throw createError({ statusCode: 401, message: 'Sign in or use admin/API access' })
  }

  try {
    const result = await runAudit(handles, config.ytApiKey)
    const videos = result.videos

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

    let highIntentComments: YouTubeComment[] = []
    const maxVideos = Number(config.commentsFetchMaxVideos) || 50
    if (config.ytApiKey && userId) {
      const cached = await getCachedComments(userId, handles)
      if (cached !== null) {
        highIntentComments = cached
      } else {
        const videosToFetch = videos.slice(0, maxVideos)
        for (const video of videosToFetch) {
          try {
            const comments = await fetchCommentsForVideo(video.id, video.title, config.ytApiKey)
            highIntentComments.push(...comments)
          } catch {
            // Skip videos that fail (e.g. comments disabled)
          }
        }
        await setCachedComments(userId, handles, highIntentComments)
      }
    }

    if (creatorUserId) {
      const { setCachedAudit } = await import('../service/auditCacheService')
      await setCachedAudit(creatorUserId, handles, videos, linkResults)
    }
    if (userId === ADMIN_USER_ID) {
      const { setCachedAudit } = await import('../service/auditCacheService')
      await setCachedAudit(ADMIN_USER_ID, handles, videos, linkResults)
    }

    return {
      count: videos.length,
      videos,
      linkResults,
      highIntentComments
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    throw createError({ statusCode: 500, message: msg })
  }
})
