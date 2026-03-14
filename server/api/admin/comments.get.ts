import { getCachedComments } from '~~/server/service/commentCacheService'

const ADMIN_USER_ID = 'admin'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { isAdminSessionValid } = await import('~~/server/utils/adminAuth')
  if (!config.adminPassword || !isAdminSessionValid(event, config)) {
    throw createError({ statusCode: 401, message: 'Admin access required' })
  }

  const query = getQuery(event)
  const handlesParam = query.handles
  const handles = typeof handlesParam === 'string'
    ? handlesParam.split(',').map((h) => h.trim().replace(/^@/, '')).filter(Boolean)
    : Array.isArray(handlesParam)
      ? handlesParam.flatMap((h) => String(h).split(',')).map((h) => h.trim().replace(/^@/, '')).filter(Boolean)
      : []

  if (handles.length === 0) {
    return { highIntentComments: [] }
  }

  const cached = await getCachedComments(ADMIN_USER_ID, handles)
  return { highIntentComments: cached ?? [] }
})
