import type { YouTubeChannelResponse, YouTubePlaylistResponse, YouTubeVideoDetailResponse } from '../../types/youtube'

export const getUploadsPlaylistId = async (handle: string, ytApiKey: string) => {
    const url = `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${handle}&key=${ytApiKey}`
    const data: YouTubeChannelResponse = await $fetch(url)
    if (!data.items || data.items.length === 0) {
        throw createError({ statusCode: 404, statusMessage: `Channel ${handle} not found` })
    }
    return data.items[0]!.contentDetails.relatedPlaylists.uploads
}

export const getPlaylistVideos = async (playlistId: string, ytApiKey: string, nextPageToken: string | undefined) => {
    const data: YouTubePlaylistResponse = await $fetch(
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
    return data
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