import { getCachedComments, setCachedComments } from '~~/server/service/commentCacheService'
import { fetchCommentsForVideo } from '~~/server/service/commentService'
import type { YouTubeComment } from '~~/server/service/commentService'

const ADMIN_USER_ID = 'admin'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { isAdminSessionValid } = await import('~~/server/utils/adminAuth')
  if (!config.adminPassword || !isAdminSessionValid(event, config)) {
    throw createError({ statusCode: 401, message: 'Admin access required' })
  }

  const body = await readBody<{ videos: Array<{ id: string; title: string }>; handles: string[] }>(event)
  if (!body?.videos || !Array.isArray(body.videos) || body.videos.length === 0) {
    throw createError({ statusCode: 400, message: 'videos array is required' })
  }
  if (!body?.handles || !Array.isArray(body.handles) || body.handles.length === 0) {
    throw createError({ statusCode: 400, message: 'handles array is required' })
  }

  const handles = body.handles.map((h) => h.trim().replace(/^@/, '')).filter(Boolean)
  const ytApiKey = config.ytApiKey
  const maxVideos = Number(config.commentsFetchMaxVideos) || 50

  if (!ytApiKey) {
    throw createError({ statusCode: 500, message: 'YouTube API key not configured' })
  }

  const cached = await getCachedComments(ADMIN_USER_ID, handles)
  if (cached !== null) {
    return { highIntentComments: cached }
  }

  const videosToFetch = body.videos.slice(0, maxVideos)
  const allComments: YouTubeComment[] = []

  for (const video of videosToFetch) {
    try {
      const comments = await fetchCommentsForVideo(video.id, video.title, ytApiKey)
      allComments.push(...comments)
    } catch {
      // Skip videos that fail (e.g. comments disabled)
    }
  }

  await setCachedComments(ADMIN_USER_ID, handles, allComments)

  return { highIntentComments: allComments }
})
