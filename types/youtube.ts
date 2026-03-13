import type { CategorizedLinks } from "../utils/helpers"
export interface YouTubeChannelResponse {
    items: Array<{
        contentDetails: {
            relatedPlaylists: {
                uploads: string
            }
        }
    }>
}

export interface VideoSummary {
    videoId: string
    publishedAt: string
}

export interface YouTubePlaylistResponse {
    nextPageToken?: string;
    items: Array<{
        contentDetails: {
            videoId: string;
            videoPublishedAt: string;
        };
    }>
}

export interface VideoDetails {
    id: string
    title: string
    description: string
    publishedAt: string
    viewCount: number
    likeCount: number
    commentCount: number,
    links: CategorizedLinks
}

export interface YouTubeVideoDetailResponse {
    items: Array<{
        id: string
        snippet: {
            title: string
            description: string
            publishedAt: string
        }
        statistics: {
            viewCount: string
            likeCount: string
            commentCount: string
        }
    }>
}