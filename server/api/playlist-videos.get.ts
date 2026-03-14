import type { VideoSummary } from "~~/types/youtube"
import { getPlaylistVideos } from "../service/youtubeService"

export default defineEventHandler(async (event) => {
    const { playlistId } = getQuery(event) as { playlistId: string }
    // ludwig: UUrPseYLGpNygVi34QpGNqpA
    const config = useRuntimeConfig(event)

    let allVideos: VideoSummary[] = []
    let nextPageToken: string | undefined = undefined

    try {
        // We loop until there is no 'nextPageToken'
        do {
            const data = await getPlaylistVideos(playlistId, config.ytApiKey, nextPageToken)

            const fetchedVideos = data.items.map(item => ({
                videoId: item.contentDetails.videoId,
                publishedAt: item.contentDetails.videoPublishedAt
            }))

            allVideos.push(...fetchedVideos)
            nextPageToken = data.nextPageToken

            // Safety check: Stop if we hit a massive amount of videos to avoid timeouts
            if (allVideos.length > 140) break

        } while (nextPageToken)

        return { count: allVideos.length, videos: allVideos }

    } catch (error) {
        console.log('error', error)
        throw createError({ statusCode: 500, message: 'Failed to sync videos' })
    }
})