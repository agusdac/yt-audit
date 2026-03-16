import type { ChannelScoreResult } from '~~/utils/channelScore'
import type { LinkCheckResult } from '~~/types/links'
import { getChannelDetails, getChannelVideoIds, getVideoDetails } from '~~/server/service/youtubeService'
import { runLinkCheck } from '~~/server/service/linkCheckService'
import { getLinkedChannels } from '~~/server/service/userService'
import { getCachedChannelScore, setCachedChannelScore } from '~~/server/service/scoreCacheService'
import { getCachedVideoScore, setCachedVideoScore } from '~~/server/service/scoreCacheService'
import { classifyLinks } from '~~/utils/url'
import { getLinksToCheck } from '~~/utils/url'
import { parseISO8601ToSeconds, getVideoType } from '~~/utils/duration'
import { calculateVideoScore } from '~~/utils/videoScore'
import { calculateChannelScore } from '~~/utils/channelScore'
import { extractUrls } from '~~/utils/url'

export default defineEventHandler(async (event): Promise<{
  channelScore: ChannelScoreResult
  channelHandle: string
}> => {
  const config = useRuntimeConfig(event)
  if (!config.ytApiKey) {
    throw createError({ statusCode: 503, message: 'YouTube API not configured' })
  }

  const session = await getUserSession(event)
  const creatorUserId = (session?.user as { id?: string } | undefined)?.id
  const { isAdminSessionValid } = await import('~~/server/utils/adminAuth')
  const isAdmin = config.adminPassword && isAdminSessionValid(event, config)

  if (!creatorUserId && !isAdmin) {
    throw createError({ statusCode: 401, message: 'Sign in to view channel score' })
  }

  const handleParam = getQuery(event).handle as string | undefined
  let channelHandle: string

  if (isAdmin && handleParam) {
    channelHandle = handleParam.trim().replace(/^@/, '')
    if (!channelHandle) throw createError({ statusCode: 400, message: 'Handle required for admin' })
  } else {
    const channels = creatorUserId ? await getLinkedChannels(creatorUserId) : []
    if (channels.length === 0) {
      throw createError({ statusCode: 400, message: 'No YouTube channels linked' })
    }
    channelHandle = channels[0]!.handle
  }

  const forceRefresh = getQuery(event).refresh === '1'
  const ttlHours = Number(config.scoreCacheTtlHours) || 24

  if (!forceRefresh) {
    const cached = await getCachedChannelScore(channelHandle, ttlHours)
    if (cached) return cached
  }

  const details = await getChannelDetails(channelHandle, config.ytApiKey)

  const channelUrls = extractUrls(details.description)
  const channelLinkChecks =
    channelUrls.length > 0
      ? await runLinkCheck(channelUrls.map((url) => ({ url, videoIds: [] })))
      : []

  // Get the last 10 videos by published date
  const videoIds = await getChannelVideoIds(channelHandle, config.ytApiKey, 10)
  let lastVideoPublishedAt: string | undefined
  const last10VideoScores: number[] = []
  const last10VideoScoresWithIds: Array<{ videoId: string; score: number }> = []

  if (videoIds.length > 0) {
    const rawVideos = await getVideoDetails(videoIds.join(','), config.ytApiKey)
    const allChannelVideoIds = await getChannelVideoIds(channelHandle, config.ytApiKey, 500)

    const urlToVideoIds = new Map<string, string[]>()
    for (const raw of rawVideos) {
      const links = classifyLinks(raw.snippet.description)
      for (const url of getLinksToCheck(links)) {
        const existing = urlToVideoIds.get(url) ?? []
        if (!existing.includes(raw.id)) {
          existing.push(raw.id)
          urlToVideoIds.set(url, existing)
        }
      }
    }
    const checks = [...urlToVideoIds.entries()].map(([url, vids]) => ({ url, videoIds: vids }))
    const videoLinkResults = checks.length > 0 ? await runLinkCheck(checks) : []

    const sortedByDate = [...rawVideos].sort(
      (a, b) => new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
    )
    lastVideoPublishedAt = sortedByDate[0]?.snippet.publishedAt

    for (const raw of rawVideos) {
      let score: number
      const cachedVideoScore = !forceRefresh ? await getCachedVideoScore(raw.id, ttlHours) : null
      if (cachedVideoScore) {
        score = cachedVideoScore.score
      } else {
        const links = classifyLinks(raw.snippet.description)
        const videoScore = calculateVideoScore(
          {
            title: raw.snippet.title,
            description: raw.snippet.description,
            duration: parseISO8601ToSeconds(raw.contentDetails.duration),
            thumbnails: raw.snippet.thumbnails ? { maxres: raw.snippet.thumbnails.maxres } : undefined,
            definition: raw.contentDetails.definition,
            links,
            linkResults: videoLinkResults,
            channelVideoIds: allChannelVideoIds,
            tags: (raw.snippet as { tags?: string[] }).tags
          },
          raw.id
        )
        score = videoScore.score
        await setCachedVideoScore(raw.id, videoScore)
      }
      last10VideoScores.push(score)
      last10VideoScoresWithIds.push({ videoId: raw.id, score })
    }
  }

  const channelScore = calculateChannelScore({
    description: details.description,
    customUrl: details.customUrl,
    thumbnails: details.thumbnails,
    keywords: details.keywords,
    brandingSettings: details.brandingSettings,
    linkResults: channelLinkChecks,
    lastVideoPublishedAt,
    last10VideoScores
  })

  const result = { channelScore, channelHandle, last10VideoScores: last10VideoScoresWithIds }
  await setCachedChannelScore(channelHandle, result)

  return result
})
