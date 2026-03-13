import type { CategorizedLinks } from "../utils/url"
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

export type VideoType = 'video' | 'short' | 'live'

export interface VideoDetails {
    id: string
    title: string
    description: string
    publishedAt: string
    viewCount: number
    likeCount: number
    commentCount: number,
    duration: number,
    type: VideoType,
    links: CategorizedLinks,
    hasPaidProductPlacement: boolean
    channelHandle?: string
}

export interface YouTubeVideoDetailSingleResponse {
    id: string
    snippet: {
        title: string
        description: string
        publishedAt: string
        liveBroadcastContent: string
    }
    statistics: {
        viewCount: string
        likeCount: string
        commentCount: string
    },
    contentDetails: {
        duration: string
    },
    paidProductPlacementDetails?: {
        hasPaidProductPlacement: boolean
    }
}

export interface YouTubeVideoDetailResponse {
    items: Array<YouTubeVideoDetailSingleResponse>
}