import { runAudit } from '../utils/runAudit'
import { getLinkedChannels } from '../service/userService'
import { isAdminSessionValid } from '../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { checkRateLimit } = await import('../utils/rateLimit')
  const { getApiKeyFromEvent } = await import('../utils/apiAuth')
  const apiKey = getApiKeyFromEvent(event)
  const limitKey = apiKey || getRequestIP(event, { xForwardedFor: true }) || 'anon'
  const rl = checkRateLimit(limitKey, Number(config.apiRateLimitPerMin) || 60)
  if (!rl.ok) {
    setResponseStatus(event, 429)
    setHeader(event, 'Retry-After', rl.retryAfter ?? 60)
    throw createError({ statusCode: 429, message: 'Rate limit exceeded' })
  }
  if (apiKey && config.apiKey && apiKey !== config.apiKey) {
    throw createError({ statusCode: 401, message: 'Invalid API key' })
  }

  let handles: string[]
  const session = await getUserSession(event)
  const creatorUserId = (session?.user as { id?: string } | undefined)?.id
  const isAdmin = config.adminPassword && isAdminSessionValid(event, config)

  if (creatorUserId) {
    const channels = await getLinkedChannels(creatorUserId)
    handles = channels.map(c => c.handle)
    if (handles.length === 0) {
      throw createError({ statusCode: 400, message: 'No YouTube channels linked to your account' })
    }
  } else if (isAdmin || apiKey) {
    const body = await readBody<{ handles: string[] }>(event)
    if (!body?.handles || !Array.isArray(body.handles) || body.handles.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one channel handle is required' })
    }
    handles = body.handles
  } else {
    throw createError({ statusCode: 401, message: 'Sign in or use admin/API access' })
  }

  try {
    return await runAudit(handles, config.ytApiKey)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    throw createError({ statusCode: 500, message: msg })
  }
})
