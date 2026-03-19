import type { VideoDetails } from '~~/types/youtube'
import { getUploadsPlaylistId, getPlaylistVideos, getVideoDetails } from '../service/youtubeService'
import { classifyLinks } from '~~/utils/url'
import { parseISO8601ToSeconds, getVideoType } from '~~/utils/duration'

const normalizeHandle = (h: string): string =>
  h.trim().replace(/^@/, '')

export async function runAudit(
  handles: string[],
  ytApiKey: string,
  maxVideos?: number
): Promise<{ count: number; videos: VideoDetails[] }> {
  const uniqueHandles = [...new Set(handles.map(normalizeHandle).filter(Boolean))]
  const config = useRuntimeConfig()
  const VIDEO_DETAILS_CONCURRENCY = 4
  const limit = maxVideos ?? config.maxVideosToFetch ?? 200

  const handleResults = await Promise.all(
    uniqueHandles.map(async (handle) => {
      const handleStart = Date.now()
      const playlistId = await getUploadsPlaylistId(handle, ytApiKey)
      let allVideoIds: string[] = []
      let nextPageToken: string | undefined = undefined

      do {
        const data = await getPlaylistVideos(playlistId, ytApiKey, nextPageToken)
        allVideoIds.push(...data.items.map(i => i.contentDetails.videoId))
        nextPageToken = data.nextPageToken
        if (allVideoIds.length >= limit) break
      } while (nextPageToken)

      const chunks: string[] = []
      for (let i = 0; i < allVideoIds.length; i += 50) {
        chunks.push(allVideoIds.slice(i, i + 50).join(','))
      }

      const chunkResults: Awaited<ReturnType<typeof getVideoDetails>>[] = []
      for (let i = 0; i < chunks.length; i += VIDEO_DETAILS_CONCURRENCY) {
        const batch = chunks.slice(i, i + VIDEO_DETAILS_CONCURRENCY)
        const batchResults = await Promise.all(batch.map((chunk) => getVideoDetails(chunk, ytApiKey)))
        chunkResults.push(...batchResults)
      }

      const videos: VideoDetails[] = []
      for (const details of chunkResults) {
        for (const v of details) {
          videos.push({
            id: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            links: classifyLinks(v.snippet.description),
            viewCount: parseInt(v.statistics.viewCount) || 0,
            likeCount: parseInt(v.statistics.likeCount) || 0,
            commentCount: parseInt(v.statistics.commentCount) || 0,
            duration: parseISO8601ToSeconds(v.contentDetails.duration),
            type: getVideoType(v),
            publishedAt: v.snippet.publishedAt,
            hasPaidProductPlacement: v.paidProductPlacementDetails?.hasPaidProductPlacement ?? false,
            channelHandle: handle,
            tags: v.snippet.tags
          })
        }
      }
      console.log(`[audit] Fetched ${allVideoIds.length} videos for @${handle} in ${Date.now() - handleStart}ms`)
      return videos
    })
  )

  const allVideos = handleResults.flat()

  const seen = new Map<string, VideoDetails>()
  for (const v of allVideos) {
    if (!seen.has(v.id)) seen.set(v.id, v)
  }

  const hasMonetizationLinks = (v: VideoDetails) =>
    v.links.sponsors.length > 0 || v.links.affiliates.length > 0 ||
    v.links.merch.length > 0 || v.links.socialWithRevenue.length > 0 || v.links.other.length > 0

  let videos = [...seen.values()].sort((a, b) => {
    const aHas = hasMonetizationLinks(a) ? 1 : 0
    const bHas = hasMonetizationLinks(b) ? 1 : 0
    if (aHas !== bHas) return bHas - aHas
    return b.viewCount - a.viewCount
  })

  if (maxVideos !== undefined && videos.length > maxVideos) {
    videos = videos.slice(0, maxVideos)
  }

  return { count: videos.length, videos }
}
