import type { YouTubeComment } from '~~/server/service/commentService'
import { runAudit } from '~~/server/utils/runAudit'
import { fetchRawCommentsForVideo } from '~~/server/service/commentService'

const TARGET_COMMENT_COUNT = 200

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { isAdminSessionValid } = await import('~~/server/utils/adminAuth')
  if (!config.adminPassword || !isAdminSessionValid(event, config)) {
    throw createError({ statusCode: 401, message: 'Admin access required' })
  }

  const body = await readBody<{ handles: string[]; highIntentOnly?: boolean }>(event)
  if (!body?.handles || !Array.isArray(body.handles) || body.handles.length === 0) {
    throw createError({ statusCode: 400, message: 'handles array is required' })
  }

  const handles = body.handles.map((h) => h.trim().replace(/^@/, '')).filter(Boolean)
  if (handles.length === 0) {
    throw createError({ statusCode: 400, message: 'At least one channel handle is required' })
  }

  if (!config.ytApiKey) {
    throw createError({ statusCode: 500, message: 'YouTube API key not configured' })
  }

  const result = await runAudit(handles, config.ytApiKey)
  const videos = result.videos

  const allComments: YouTubeComment[] = []

  const useHighIntent = body.highIntentOnly === true
  const fetchFn = useHighIntent ? fetchRawCommentsForVideo : fetchRawCommentsForVideo

  for (const video of videos) {
    if (allComments.length >= TARGET_COMMENT_COUNT) break

    try {
      const comments = await fetchFn(video.id, video.title, config.ytApiKey)
      const remaining = TARGET_COMMENT_COUNT - allComments.length
      allComments.push(...comments.slice(0, remaining))
    } catch {
      // Skip videos that fail (e.g. comments disabled)
    }
  }

  return { comments: allComments }
})
