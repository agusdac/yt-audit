import { setAdminOverride } from '../../service/tierService'
import { getOrCreateSubscription } from '../../service/tierService'
import { isAdminSessionValid } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.adminPassword || !isAdminSessionValid(event, config)) {
    throw createError({ statusCode: 401, message: 'Admin access required' })
  }

  const body = await readBody<{ userId: string; tier: 'free' | 'pro' | null }>(event)
  if (!body?.userId) {
    throw createError({ statusCode: 400, message: 'userId is required' })
  }
  if (body.tier !== undefined && body.tier !== null && body.tier !== 'free' && body.tier !== 'pro') {
    throw createError({ statusCode: 400, message: 'tier must be "free", "pro", or null' })
  }

  await getOrCreateSubscription(body.userId)
  await setAdminOverride(body.userId, body.tier ?? null)

  return { ok: true }
})
