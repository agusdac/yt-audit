import { getLinkedChannels } from '~~/server/service/userService'
import { getCachedAudit } from '~~/server/service/auditCacheService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Sign in to access audit cache' })
  }

  const channels = await getLinkedChannels(userId)
  const handles = channels.map((c) => c.handle)
  if (handles.length === 0) {
    return { cached: false, videos: [], linkResults: [] }
  }

  const config = useRuntimeConfig(event)
  const ttlHours = Number(config.auditCacheTtlHours) || 24

  const cached = await getCachedAudit(userId, handles, ttlHours)
  if (!cached) {
    return { cached: false, videos: [], linkResults: [] }
  }

  return {
    cached: true,
    videos: cached.videos,
    linkResults: cached.linkResults
  }
})
