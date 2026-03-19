import { getLinkedChannels } from '~~/server/service/userService'
import { getCachedComments } from '~~/server/service/commentCacheService'
import { getAnsweredCommentIds } from '~~/server/service/answeredCommentsService'
import { getWrongCommentIds } from '~~/server/service/wrongCommentsService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Sign in to access comments' })
  }

  const channels = await getLinkedChannels(userId)
  const handles = channels.map((c) => c.handle)
  if (handles.length === 0) {
    return { highIntentComments: [], answeredCommentIds: [], wrongCommentIds: [] }
  }

  const cached = await getCachedComments(userId, handles)
  const [answeredCommentIds, wrongCommentIds] = await Promise.all([
    getAnsweredCommentIds(userId),
    getWrongCommentIds(userId)
  ])
  const wrongSet = new Set(wrongCommentIds)
  const filtered = (cached ?? []).filter((c) => !wrongSet.has(c.id))
  return { highIntentComments: filtered, answeredCommentIds, wrongCommentIds }
})
