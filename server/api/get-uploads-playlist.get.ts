import { getUploadsPlaylistId } from "../service/youtubeService"

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)

    const query = getQuery(event)
    const handle = query.handle as string

    if (!handle) {
        throw createError({ statusCode: 400, statusMessage: 'YouTube handle is required' })
    }

    const cleanHandle = handle.startsWith('@') ? handle.replace(/^@/, '') : handle

    try {
        const uploadsPlaylistId = await getUploadsPlaylistId(cleanHandle, config.ytApiKey)

        return {
            success: true,
            channel: cleanHandle,
            uploadsPlaylistId
        }

    } catch (error) {
        console.error('Google API Request Failed:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to communicate with YouTube' })
    }
})
