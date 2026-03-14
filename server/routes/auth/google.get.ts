import { sendRedirect } from 'h3'
import { getOrCreateUser, syncLinkedChannels } from '~~/server/service/userService'

interface YouTubeChannelsResponse {
  items?: Array<{
    id: string
    snippet: { title: string; customUrl?: string }
  }>
}

async function fetchYouTubeChannels(accessToken: string): Promise<Array<{ channelId: string; handle: string; channelTitle: string }>> {
  const res = await $fetch<YouTubeChannelsResponse>(
    'https://www.googleapis.com/youtube/v3/channels',
    {
      query: { part: 'snippet', mine: 'true' },
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )
  if (!res.items?.length) return []
  return res.items.map((ch) => {
    const handle = ch.snippet.customUrl?.replace(/^@/, '') ?? ch.id
    return {
      channelId: ch.id,
      handle,
      channelTitle: ch.snippet.title
    }
  })
}

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile', 'openid', 'https://www.googleapis.com/auth/youtube.readonly'],
    authorizationParams: { access_type: 'offline', prompt: 'consent' }
  },
  async onSuccess(event, { user, tokens }) {
    const userId = await getOrCreateUser(
      { sub: user.sub, email: user.email, name: user.name, picture: user.picture },
      { access_token: tokens.access_token, refresh_token: tokens.refresh_token }
    )

    try {
      const channels = await fetchYouTubeChannels(tokens.access_token)
      await syncLinkedChannels(userId, channels)
    } catch {
      // User may have no YouTube channel; continue
    }

    await setUserSession(event, {
      user: { id: userId },
      loggedInAt: new Date()
    })
    return sendRedirect(event, '/dashboard')
  }
})
