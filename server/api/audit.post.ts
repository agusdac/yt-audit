import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import type { YouTubeComment } from '~~/server/service/commentService'
import { runAudit } from '../utils/runAudit'
import { getLinkedChannels } from '../service/userService'
import { isAdminSessionValid } from '../utils/adminAuth'
import {
  getOrCreateSubscription,
  canRunAudit,
  getEffectiveTier,
  getMaxVideosForTier,
  incrementAuditsUsed
} from '../service/tierService'
import { getLinksToCheck } from '~~/utils/url'
import { runLinkCheck } from '../service/linkCheckService'
import { getCachedComments, setCachedComments } from '../service/commentCacheService'
import { fetchCommentsForVideo } from '../service/commentService'
import { getWrongCommentIds } from '../service/wrongCommentsService'

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
    const retrySec = rl.retryAfter ?? 60
    setHeader(event, 'Retry-After', retrySec)
    throw createError({ statusCode: 429, message: `Rate limit exceeded. Retry after ${retrySec} seconds.` })
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
    if (!isAdmin) {
      await getOrCreateSubscription(creatorUserId)
      const allowed = await canRunAudit(creatorUserId)
      if (!allowed) {
        setResponseStatus(event, 403)
        throw createError({
          statusCode: 403,
          message: 'Audit limit reached. Upgrade to Pro for unlimited audits.',
          data: { code: 'AUDIT_LIMIT' }
        })
      }
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

  const auditStart = Date.now()
  const tier = creatorUserId && !isAdmin
    ? await getEffectiveTier(creatorUserId)
    : 'pro'
  const maxVideos = getMaxVideosForTier(tier)
  console.log(`[audit] Starting audit for handles: ${handles.join(', ')} (tier=${tier}, maxVideos=${maxVideos})`)

  try {
    const result = await runAudit(handles, config.ytApiKey, maxVideos)
    const videos = result.videos
    console.log(`[audit] Fetched ${videos.length} videos in ${Date.now() - auditStart}ms`)

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
      console.log(`[audit] Checking ${checks.length} links...`)
      const linkCheckStart = Date.now()
      linkResults = await runLinkCheck(checks)
      console.log(`[audit] Link check done in ${Date.now() - linkCheckStart}ms`)
    }

    let highIntentComments: YouTubeComment[] = []
    const maxVideos = Number(config.commentsFetchMaxVideos) || 50
    if (config.ytApiKey && userId) {
      const cached = await getCachedComments(userId, handles)
      let rawComments: YouTubeComment[] = []
      if (cached !== null) {
        rawComments = cached
      } else {
        const videosToFetch = videos.slice(0, maxVideos)
        console.log(`[audit] Fetching comments for ${videosToFetch.length} videos...`)
        const commentsStart = Date.now()
        const hfOptions = config.detectIntentViaHf && config.hfToken
          ? { useHF: true, hfToken: config.hfToken }
          : undefined
        const COMMENT_CONCURRENCY = 5
        for (let i = 0; i < videosToFetch.length; i += COMMENT_CONCURRENCY) {
          const batch = videosToFetch.slice(i, i + COMMENT_CONCURRENCY)
          const batchResults = await Promise.all(
            batch.map((video) =>
              fetchCommentsForVideo(video.id, video.title, config.ytApiKey, 3, hfOptions)
                .catch(() => [] as YouTubeComment[])
            )
          )
          for (const comments of batchResults) {
            rawComments.push(...comments)
          }
        }
        await setCachedComments(userId, handles, rawComments)
        console.log(`[audit] Comments fetched in ${Date.now() - commentsStart}ms`)
      }
      if (creatorUserId) {
        const wrongIds = await getWrongCommentIds(creatorUserId)
        const wrongSet = new Set(wrongIds)
        highIntentComments = rawComments.filter((c) => !wrongSet.has(c.id))
      } else {
        highIntentComments = rawComments
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

    if (creatorUserId && !isAdmin) {
      await incrementAuditsUsed(creatorUserId)
    }
    if (creatorUserId) {
      try {
        const { saveAuditHistoryWithLinks } = await import('../service/auditHistoryService')
        await saveAuditHistoryWithLinks(handles, videos, linkResults)
      } catch {
        // ignore
      }
    }

    console.log(`[audit] Complete in ${Date.now() - auditStart}ms`)

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
