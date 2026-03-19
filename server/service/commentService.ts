import purchaseIntentKeywords from '../../config/purchase-intent-keywords.json'

export interface YouTubeComment {
  id: string
  videoId: string
  videoTitle: string
  text: string
  authorDisplayName: string
  publishedAt: string
  permalink: string
  canReply?: boolean
}

interface CommentThreadSnippet {
  canReply?: boolean
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

const NEGATION_PATTERNS = [
  "don't", "dont", "won't", "wont", "not going to", "never", "no longer",
  "can't", "cant", "wouldn't", "wouldnt", "shouldn't", "shouldnt",
  "not interested", "not gonna", "not buying", "not going to buy",
  "no thanks", "not for me", "not right now", "maybe later", "pass", "skip"
]

const NEGATION_WINDOW = 50

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function detectPurchaseIntent(text: string): boolean {
  const normalized = normalizeText(text)
  if (normalized.length < 10) return false

  for (const phrase of PHRASES) {
    const idx = normalized.indexOf(phrase)
    if (idx === -1) continue

    const beforePhrase = normalized.slice(Math.max(0, idx - NEGATION_WINDOW), idx)
    const hasNegation = NEGATION_PATTERNS.some((neg) => beforePhrase.includes(neg))
    if (hasNegation) continue

    return true
  }
  return false
}

const HF_MODEL = 'j-hartmann/purchase-intention-english-roberta-large'
const HF_DELAY_MS = 100

async function detectPurchaseIntentViaHF(text: string, hfToken: string): Promise<boolean> {
  if (!text || text.trim().length < 10) return false
  try {
    const res = await $fetch<Array<{ label: string; score: number }>>(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${hfToken}` },
        body: { inputs: text.trim().slice(0, 512) }
      }
    )
    const item = Array.isArray(res) ? res[0] : res
    if (item && typeof item === 'object' && 'label' in item) {
      return (String(item.label).toLowerCase() === 'yes') || (!!item.score && item.score > 0.5)
    }
  } catch {
    // Fallback to keywords on API failure
  }
  return detectPurchaseIntent(text)
}

export async function fetchCommentsForVideo(
  videoId: string,
  videoTitle: string,
  ytApiKey: string,
  maxPages = 3,
  options?: { useHF?: boolean; hfToken?: string }
): Promise<YouTubeComment[]> {
  const results: YouTubeComment[] = []
  let pageToken: string | undefined
  const useHF = options?.useHF && options?.hfToken

  const checkIntent = async (text: string): Promise<boolean> => {
    if (useHF) {
      const result = await detectPurchaseIntentViaHF(text, options!.hfToken!)
      await new Promise((r) => setTimeout(r, HF_DELAY_MS))
      return result
    }
    return detectPurchaseIntent(text)
  }

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
      const hasIntent = useHF ? await checkIntent(text) : detectPurchaseIntent(text)
      if (!hasIntent) continue

      const topLevel = item.snippet?.topLevelComment
      const commentId = topLevel?.id ?? item.id
      results.push({
        id: commentId,
        videoId,
        videoTitle,
        text,
        authorDisplayName: top.authorDisplayName ?? '',
        publishedAt: top.publishedAt ?? '',
        permalink: `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`,
        canReply: item.snippet?.canReply ?? true
      })
    }

    pageToken = data.nextPageToken
    if (!pageToken) break
  }

  return results
}

export const replyToComment = async (
  parentId: string,
  text: string,
  accessToken: string
): Promise<void> => {
  await $fetch('https://www.googleapis.com/youtube/v3/comments', {
    method: 'POST',
    query: { part: 'snippet' },
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { snippet: { parentId, textOriginal: text } }
  })
}

/** Fetch raw comments (no purchase-intent filter) for a video. Used for admin export. */
export async function fetchRawCommentsForVideo(
  videoId: string,
  videoTitle: string,
  ytApiKey: string,
  maxPages = 2
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
      const topLevel = item.snippet?.topLevelComment
      const commentId = topLevel?.id ?? item.id
      results.push({
        id: commentId,
        videoId,
        videoTitle,
        text,
        authorDisplayName: top.authorDisplayName ?? '',
        publishedAt: top.publishedAt ?? '',
        permalink: `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`,
        canReply: item.snippet?.canReply ?? true
      })
    }

    pageToken = data.nextPageToken
    if (!pageToken) break
  }

  return results
}
