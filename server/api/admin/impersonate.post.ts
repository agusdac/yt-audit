import { getChannelByHandle } from '~~/server/service/youtubeService'
import { getOrCreateImpersonationUser } from '~~/server/service/userService'
import { getOrCreateSubscription, setAdminOverride } from '~~/server/service/tierService'
import { setAdminSession } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string; handle?: string; tier?: 'free' | 'pro' }>(event)
  const config = useRuntimeConfig(event)

  if (!config.adminPassword) {
    throw createError({ statusCode: 503, message: 'Admin impersonation not configured' })
  }

  if (body?.password !== config.adminPassword) {
    throw createError({ statusCode: 401, message: 'Invalid password' })
  }

  const handle = body?.handle?.trim().replace(/^@/, '')
  if (!handle) {
    throw createError({ statusCode: 400, message: 'Channel handle is required' })
  }

  if (!config.ytApiKey) {
    throw createError({ statusCode: 503, message: 'YouTube API not configured' })
  }

  const channelInfo = await getChannelByHandle(handle, config.ytApiKey)
  const userId = await getOrCreateImpersonationUser(channelInfo)

  const tier = body?.tier === 'free' ? 'free' : 'pro'
  await getOrCreateSubscription(userId)
  await setAdminOverride(userId, tier)

  setAdminSession(event, config)
  await setUserSession(event, {
    user: { id: userId },
    loggedInAt: new Date()
  })

  console.log(`[impersonate] Admin impersonating @${handle} as user ${userId}`)

  return { ok: true, redirect: '/dashboard' }
})
