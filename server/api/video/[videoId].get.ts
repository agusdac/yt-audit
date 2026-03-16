import type { VideoDetails } from '~~/types/youtube'
import type { LinkCheckResult } from '~~/types/links'
import type { VideoScoreResult } from '~~/utils/videoScore'
import { getVideoDetails, getChannelVideoIds } from '~~/server/service/youtubeService'
import { runLinkCheck } from '~~/server/service/linkCheckService'
import { getLinkedChannels } from '~~/server/service/userService'
import { getCachedVideoScore, setCachedVideoScore } from '~~/server/service/scoreCacheService'
import { classifyLinks } from '~~/utils/url'
import { parseISO8601ToSeconds, getVideoType } from '~~/utils/duration'
import { calculateVideoScore } from '~~/utils/videoScore'
import { getLinksToCheck } from '~~/utils/url'

export default defineEventHandler(async (event): Promise<{
  video: VideoDetails
  linkResults: LinkCheckResult[]
  score: VideoScoreResult
}> => {
  const videoId = getRouterParam(event, 'videoId')
  if (!videoId) {
    throw createError({ statusCode: 400, message: 'Video ID required' })
  }

  const config = useRuntimeConfig(event)
  if (!config.ytApiKey) {
    throw createError({ statusCode: 503, message: 'YouTube API not configured' })
  }

  const session = await getUserSession(event)
  const creatorUserId = (session?.user as { id?: string } | undefined)?.id
  const { isAdminSessionValid } = await import('~~/server/utils/adminAuth')
  const isAdmin = config.adminPassword && isAdminSessionValid(event, config)

  if (!creatorUserId && !isAdmin) {
    throw createError({ statusCode: 401, message: 'Sign in to view video details' })
  }

  const channels = creatorUserId ? await getLinkedChannels(creatorUserId) : []
  if (channels.length === 0) {
    throw createError({ statusCode: 400, message: 'No YouTube channels linked' })
  }

  const rawItems = await getVideoDetails(videoId, config.ytApiKey)
  const raw = rawItems[0]
  if (!raw) {
    throw createError({ statusCode: 404, message: 'Video not found' })
  }

  const videoChannelId = raw.snippet.channelId
  const linkedChannel = channels.find((c) => c.channelId === videoChannelId)
  if (!linkedChannel) {
    throw createError({ statusCode: 403, message: 'Video does not belong to your linked channels' })
  }

  const links = classifyLinks(raw.snippet.description)
  const urlsToCheck = getLinksToCheck(links)
  const checks = urlsToCheck.length > 0
    ? urlsToCheck.map((url) => ({ url, videoIds: [videoId] }))
    : []

  const linkResults = await runLinkCheck(checks)

  const forceRefresh = getQuery(event).refresh === '1'
  const ttlHours = Number(config.scoreCacheTtlHours) || 24

  let score: VideoScoreResult
  if (!forceRefresh) {
    const cached = await getCachedVideoScore(videoId, ttlHours)
    if (cached) {
      const video: VideoDetails = {
        id: raw.id,
        title: raw.snippet.title,
        description: raw.snippet.description,
        publishedAt: raw.snippet.publishedAt,
        viewCount: parseInt(raw.statistics.viewCount) || 0,
        likeCount: parseInt(raw.statistics.likeCount) || 0,
        commentCount: parseInt(raw.statistics.commentCount) || 0,
        duration: parseISO8601ToSeconds(raw.contentDetails.duration),
        type: getVideoType(raw),
        links,
        hasPaidProductPlacement: raw.paidProductPlacementDetails?.hasPaidProductPlacement ?? false,
        channelHandle: linkedChannel.handle,
        thumbnails: raw.snippet.thumbnails ? { maxres: raw.snippet.thumbnails.maxres } : undefined,
        definition: raw.contentDetails.definition,
        channelId: raw.snippet.channelId,
        tags: (raw.snippet as { tags?: string[] }).tags
      }
      return { video, linkResults, score: cached }
    }
  }

  const channelVideoIds = await getChannelVideoIds(linkedChannel.handle, config.ytApiKey, 500)

  const video: VideoDetails = {
    id: raw.id,
    title: raw.snippet.title,
    description: raw.snippet.description,
    publishedAt: raw.snippet.publishedAt,
    viewCount: parseInt(raw.statistics.viewCount) || 0,
    likeCount: parseInt(raw.statistics.likeCount) || 0,
    commentCount: parseInt(raw.statistics.commentCount) || 0,
    duration: parseISO8601ToSeconds(raw.contentDetails.duration),
    type: getVideoType(raw),
    links,
    hasPaidProductPlacement: raw.paidProductPlacementDetails?.hasPaidProductPlacement ?? false,
    channelHandle: linkedChannel.handle,
    thumbnails: raw.snippet.thumbnails ? { maxres: raw.snippet.thumbnails.maxres } : undefined,
    definition: raw.contentDetails.definition,
    channelId: raw.snippet.channelId,
    tags: (raw.snippet as { tags?: string[] }).tags
  }

  score = calculateVideoScore(
    {
      title: video.title,
      description: video.description,
      duration: video.duration,
      thumbnails: video.thumbnails,
      definition: video.definition,
      links: video.links,
      linkResults,
      channelVideoIds,
      tags: (raw.snippet as { tags?: string[] }).tags
    },
    videoId
  )

  await setCachedVideoScore(videoId, score)

  return { video, linkResults, score }
})
