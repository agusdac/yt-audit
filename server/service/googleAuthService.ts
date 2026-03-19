import { getUserById } from './userService'

export const getAccessToken = async (userId: string): Promise<string> => {
  const config = useRuntimeConfig()
  const clientId = config.oauth?.google?.clientId as string | undefined
  const clientSecret = config.oauth?.google?.clientSecret as string | undefined
  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, message: 'OAuth not configured' })
  }

  const user = await getUserById(userId)
  const refreshToken = user?.refreshToken
  if (!refreshToken) {
    throw createError({
      statusCode: 403,
      message: 'Reconnect your YouTube account to use this feature. Sign out and sign in again.',
      data: { code: 'REAUTH_REQUIRED' }
    })
  }

  const res = await $fetch<{ access_token?: string; error?: string; error_description?: string }>(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    }
  )

  if (res.error || !res.access_token) {
    throw createError({
      statusCode: 403,
      message: res.error_description ?? 'Failed to refresh access token. Reconnect your YouTube account.',
      data: { code: 'REAUTH_REQUIRED' }
    })
  }

  return res.access_token
}
