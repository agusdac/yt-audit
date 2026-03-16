import type { YouTubeChannelResponse, YouTubePlaylistResponse, YouTubeVideoDetailResponse } from '../../types/youtube'

export const getChannelByHandle = async (
  handle: string,
  ytApiKey: string
): Promise<{ channelId: string; handle: string; channelTitle: string; avatarUrl?: string }> => {
  const data = await $fetch<{
    items?: Array<{
      id: string
      snippet: {
        title: string
        customUrl?: string
        thumbnails?: { default?: { url: string }; medium?: { url: string }; high?: { url: string } }
      }
    }>
  }>(
    'https://youtube.googleapis.com/youtube/v3/channels',
    {
      query: { part: 'snippet', forHandle: handle.replace(/^@/, ''), key: ytApiKey }
    }
  )
  if (!data.items?.length) {
    throw createError({ statusCode: 404, statusMessage: `Channel @${handle} not found` })
  }
  const ch = data.items[0]!
  const handleStr = ch.snippet.customUrl?.replace(/^@/, '') ?? handle.replace(/^@/, '')
  const thumbnails = ch.snippet.thumbnails
  const avatarUrl = thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url
  return {
    channelId: ch.id,
    handle: handleStr,
    channelTitle: ch.snippet.title,
    avatarUrl
  }
}

export const getUploadsPlaylistId = async (handle: string, ytApiKey: string) => {
  const url = `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${handle}&key=${ytApiKey}`
  const data = await $fetch<YouTubeChannelResponse>(url)
  if (!data.items || data.items.length === 0) {
    throw createError({ statusCode: 404, statusMessage: `Channel ${handle} not found` })
  }
  return data.items[0]!.contentDetails.relatedPlaylists.uploads
}

export const getPlaylistVideos = async (playlistId: string, ytApiKey: string, nextPageToken: string | undefined): Promise<YouTubePlaylistResponse> => {
  const data = await $fetch<YouTubePlaylistResponse>(
    'https://www.googleapis.com/youtube/v3/playlistItems',
    {
      query: {
        part: 'contentDetails',
        playlistId: playlistId,
        maxResults: 50, // Max allowed per request
        pageToken: nextPageToken,
        key: ytApiKey
      }
    }
  )
  return data as YouTubePlaylistResponse
}

export const getVideoDetails = async (chunkedIds: string, ytApiKey: string) => {
  const details = await $fetch<YouTubeVideoDetailResponse>(
    'https://www.googleapis.com/youtube/v3/videos',
    {
      query: {
        part: 'snippet,statistics,contentDetails,paidProductPlacementDetails',
        id: chunkedIds,
        key: ytApiKey
      }
    }
  )
  if (!details.items || details.items.length === 0) {
    throw createError({ statusCode: 404, statusMessage: `Videos ${chunkedIds} not found` })
  }
  return details.items
}

export interface ChannelDetails {
  channelId: string
  handle: string
  description: string
  customUrl?: string
  thumbnails?: { default?: { url: string } }
  brandingSettings?: {
    channel?: { unsubscribedTrailer?: string }
    watch?: { featuredPlaylistId?: string }
    image?: { bannerExternalUrl?: string }
  }
}

export const getChannelDetails = async (
  handle: string,
  ytApiKey: string
): Promise<ChannelDetails> => {
  const data = await $fetch<{
    items?: Array<{
      id: string
      snippet: {
        title: string
        description: string
        customUrl?: string
        thumbnails?: { default?: { url: string }; medium?: { url: string }; high?: { url: string } }
      }
      brandingSettings?: {
        channel?: { unsubscribedTrailer?: string }
        watch?: { featuredPlaylistId?: string }
        image?: { bannerExternalUrl?: string }
      }
    }>
  }>('https://youtube.googleapis.com/youtube/v3/channels', {
    query: {
      part: 'snippet,brandingSettings',
      forHandle: handle.replace(/^@/, ''),
      key: ytApiKey
    }
  })
  if (!data.items?.length) {
    throw createError({ statusCode: 404, statusMessage: `Channel @${handle} not found` })
  }
  const ch = data.items[0]!
  const handleStr = ch.snippet.customUrl?.replace(/^@/, '') ?? handle.replace(/^@/, '')
  return {
    channelId: ch.id,
    handle: handleStr,
    description: ch.snippet.description ?? '',
    customUrl: ch.snippet.customUrl,
    thumbnails: ch.snippet.thumbnails ? { default: ch.snippet.thumbnails.default } : undefined,
    brandingSettings: ch.brandingSettings
  }
}

export const getChannelVideoIds = async (
  handle: string,
  ytApiKey: string,
  maxIds = 500
): Promise<string[]> => {
  const playlistId = await getUploadsPlaylistId(handle.replace(/^@/, ''), ytApiKey)
  const ids: string[] = []
  let nextPageToken: string | undefined
  do {
    const data = await getPlaylistVideos(playlistId, ytApiKey, nextPageToken)
    ids.push(...data.items.map((i) => i.contentDetails.videoId))
    nextPageToken = data.nextPageToken
    if (ids.length >= maxIds) break
  } while (nextPageToken)
  return ids.slice(0, maxIds)
}