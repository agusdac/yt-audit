import { getLinkedChannels } from '~~/server/service/userService'
import { getCachedComments, setCachedComments } from '~~/server/service/commentCacheService'
import { fetchCommentsForVideo } from '~~/server/service/commentService'
import { getAnsweredCommentIds } from '~~/server/service/answeredCommentsService'
import { getWrongCommentIds } from '~~/server/service/wrongCommentsService'
import type { YouTubeComment } from '~~/server/service/commentService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Sign in to fetch comments' })
  }

  const body = await readBody<{ videos: Array<{ id: string; title: string }> }>(event)
  if (!body?.videos || !Array.isArray(body.videos) || body.videos.length === 0) {
    throw createError({ statusCode: 400, message: 'videos array is required' })
  }

  const config = useRuntimeConfig(event)
  const ytApiKey = config.ytApiKey
  const maxVideos = Number(config.commentsFetchMaxVideos) || 50
  if (!ytApiKey) {
    throw createError({ statusCode: 500, message: 'YouTube API key not configured' })
  }

  const channels = await getLinkedChannels(userId)
  const handles = channels.map((c) => c.handle)

  const cached = handles.length > 0 ? await getCachedComments(userId, handles) : null
  const [answeredCommentIds, wrongCommentIds] = await Promise.all([
    getAnsweredCommentIds(userId),
    getWrongCommentIds(userId)
  ])
  const wrongSet = new Set(wrongCommentIds)

  if (cached !== null) {
    const filtered = cached.filter((c) => !wrongSet.has(c.id))
    return { highIntentComments: filtered, answeredCommentIds, wrongCommentIds }
  }

  const videosToFetch = body.videos.slice(0, maxVideos)
  const allComments: YouTubeComment[] = []
  const hfOptions = config.detectIntentViaHf && config.hfToken
    ? { useHF: true, hfToken: config.hfToken }
    : undefined

  for (const video of videosToFetch) {
    try {
      const comments = await fetchCommentsForVideo(video.id, video.title, ytApiKey, 3, hfOptions)
      allComments.push(...comments)
    } catch {
      // Skip videos that fail (e.g. comments disabled)
    }
  }

  if (handles.length > 0) {
    await setCachedComments(userId, handles, allComments)
  }

  const filtered = allComments.filter((c) => !wrongSet.has(c.id))
  return { highIntentComments: filtered, answeredCommentIds, wrongCommentIds }
})
