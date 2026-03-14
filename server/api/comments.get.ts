import { getLinkedChannels } from '~~/server/service/userService'
import { getCachedComments } from '~~/server/service/commentCacheService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Sign in to access comments' })
  }

  const channels = await getLinkedChannels(userId)
  const handles = channels.map((c) => c.handle)
  if (handles.length === 0) {
    return { highIntentComments: [] }
  }

  const cached = await getCachedComments(userId, handles)
  return { highIntentComments: cached ?? [] }
})
