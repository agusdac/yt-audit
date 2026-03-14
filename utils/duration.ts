import type { VideoType, YouTubeVideoDetailSingleResponse } from "~~/types/youtube";

// Note: YouTube Data API v3 does NOT provide aspect ratio or dimensions. contentDetails.dimension
// is only for 3D vs 2D. Duration (≤60s) + liveBroadcastContent is the most reliable detection
// without extra API calls (e.g. oEmbed for dimensions).

// Simple parser for ISO 8601 duration (e.g., PT1M20S -> 80)
export const parseISO8601ToSeconds = (duration: string): number => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
};

export const getVideoType = (v: YouTubeVideoDetailSingleResponse): VideoType => {
    const seconds = parseISO8601ToSeconds(v.contentDetails.duration);
    if (v.snippet.liveBroadcastContent !== 'none') {
        return 'live';
    }

    if (seconds > 0 && seconds <= 60) {
        return 'short';
    }

    return 'video';
};