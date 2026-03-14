import purchaseIntentKeywords from '../../config/purchase-intent-keywords.json'

export interface YouTubeComment {
  id: string
  videoId: string
  videoTitle: string
  text: string
  authorDisplayName: string
  publishedAt: string
  permalink: string
}

interface CommentThreadSnippet {
  topLevelComment?: {
    id?: string
    snippet?: {
      textDisplay?: string
      authorDisplayName?: string
      publishedAt?: string
    }
  }
}

interface CommentThreadsResponse {
  items?: Array<{
    id: string
    snippet: CommentThreadSnippet
  }>
  nextPageToken?: string
}

const PHRASES = (purchaseIntentKeywords.phrases as string[]).map((p) => p.toLowerCase())

export function detectPurchaseIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return PHRASES.some((phrase) => lower.includes(phrase))
}

export async function fetchCommentsForVideo(
  videoId: string,
  videoTitle: string,
  ytApiKey: string,
  maxPages = 3
): Promise<YouTubeComment[]> {
  const results: YouTubeComment[] = []
  let pageToken: string | undefined

  for (let page = 0; page < maxPages; page++) {
    const url = 'https://www.googleapis.com/youtube/v3/commentThreads'
    const params = new URLSearchParams({
      part: 'snippet',
      videoId,
      maxResults: '100',
      key: ytApiKey,
      order: 'relevance',
      textFormat: 'plainText'
    })
    if (pageToken) params.set('pageToken', pageToken)

    const data = await $fetch<CommentThreadsResponse>(`${url}?${params}`)

    if (!data.items?.length) break

    for (const item of data.items) {
      const top = item.snippet?.topLevelComment?.snippet
      if (!top) continue

      const text = top.textDisplay?.replace(/<[^>]+>/g, '') || ''
      if (!detectPurchaseIntent(text)) continue

      const topLevel = item.snippet?.topLevelComment
      const commentId = topLevel?.id ?? item.id
      results.push({
        id: commentId,
        videoId,
        videoTitle,
        text,
        authorDisplayName: top.authorDisplayName ?? '',
        publishedAt: top.publishedAt ?? '',
        permalink: `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`
      })
    }

    pageToken = data.nextPageToken
    if (!pageToken) break
  }

  return results
}
