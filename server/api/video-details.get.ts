import { VideoDetails } from "~~/types/youtube"
import { getPlaylistVideos, getVideoDetails } from "../service/youtubeService"
import { classifyLinks, extractUrls } from "~~/utils/helpers"

export default defineEventHandler(async (event) => {
    const { playlistId } = getQuery(event) as { playlistId: string }
    const config = useRuntimeConfig(event)

    let allVideoIds: string[] = []
    let nextPageToken: string | undefined = undefined

    try {
        // Collect all Video IDs from Playlist
        do {
            const data = await getPlaylistVideos(playlistId, config.ytApiKey, nextPageToken)

            allVideoIds.push(...data.items.map(i => i.contentDetails.videoId))
            nextPageToken = data.nextPageToken

            if (allVideoIds.length >= 140) break
        } while (nextPageToken)

        // Batch fetch details (Chunks of 50)
        const detailedVideos = []
        for (let i = 0; i < allVideoIds.length; i += 50) {
            const chunk = allVideoIds.slice(i, i + 50).join(',')

            const details = await getVideoDetails(chunk, config.ytApiKey)

            detailedVideos.push(...details)
        }

        const videoDetails: VideoDetails[] = detailedVideos.map(v => ({
            id: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            links: classifyLinks(v.snippet.description),
            viewCount: parseInt(v.statistics.viewCount) || 0,
            likeCount: parseInt(v.statistics.likeCount) || 0,
            commentCount: parseInt(v.statistics.commentCount) || 0,
            publishedAt: v.snippet.publishedAt
        }))

        return {
            count: videoDetails.length,
            videos: videoDetails
        }

    } catch (error: any) {
        console.error('Sync Error:', error.data || error)
        throw createError({ statusCode: 500, message: 'Failed to fetch detailed metrics' })
    }
})