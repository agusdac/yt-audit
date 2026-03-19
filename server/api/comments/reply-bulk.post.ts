import { getAccessToken } from '../../service/googleAuthService'
import { getEffectiveTier } from '../../service/tierService'
import { replyToComment } from '../../service/commentService'
import { markCommentAsAnswered } from '../../service/answeredCommentsService'

const DELAY_MS = 250

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface CommentInput {
  id: string
  authorDisplayName: string
  canReply?: boolean
}

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
      message: 'Bulk comment reply is a Pro feature. Upgrade to Pro to use it.',
      data: { code: 'PRO_REQUIRED' }
    })
  }

  const config = useRuntimeConfig(event)
  const { checkRateLimit } = await import('../../utils/rateLimit')
  const rl = checkRateLimit(
    `reply-bulk:${userId}`,
    config.replyBulkRateLimitPerMin ?? 10
  )
  if (!rl.ok) {
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded. Retry after ${rl.retryAfter ?? 60} seconds.`
    })
  }

  const body = await readBody<{ comments: CommentInput[]; template: string }>(event)
  const comments = body?.comments
  const template = typeof body?.template === 'string' ? body.template.trim() : ''

  if (!Array.isArray(comments) || comments.length === 0 || !template) {
    throw createError({
      statusCode: 400,
      message: 'comments (non-empty array) and template are required'
    })
  }

  const accessToken = await getAccessToken(userId)

  const replied: string[] = []
  const failed: Array<{ commentId: string; error: string }> = []
  const skipped: Array<{ commentId: string; reason: string }> = []

  for (let i = 0; i < comments.length; i++) {
    const c = comments[i]
    const commentId = c?.id
    if (!commentId || typeof commentId !== 'string') continue

    if (c?.canReply === false) {
      skipped.push({ commentId, reason: 'Replies disabled for this comment' })
      continue
    }

    const authorDisplayName = c?.authorDisplayName ?? ''
    const text = template.replaceAll('{{author}}', authorDisplayName)

    try {
      await replyToComment(commentId, text, accessToken)
      await markCommentAsAnswered(userId, commentId)
      replied.push(commentId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      failed.push({ commentId, error: msg })
    }

    if (i < comments.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  return { replied: replied.length, failed, skipped, repliedIds: replied }
})
