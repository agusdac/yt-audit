import type { LinkCheckResult } from '~~/types/links'
import { extractPromoCode, normalizeUrl } from '~~/utils/url'

const CONCURRENCY = Number(process.env.CHECK_LINKS_CONCURRENCY) || 5
const DELAY_BETWEEN_BATCHES_MS = Number(process.env.CHECK_LINKS_DELAY_MS) || 150
const REQUEST_TIMEOUT_MS = 10000

const isDeadStatus = (status: number): boolean =>
  status === 404 || (status >= 500 && status < 600)

const codeStillInUrl = (url: string, code: string): boolean => {
  const l = url.toLowerCase()
  return l.includes(`code=${code}`) || l.includes(`promo=${code}`) || l.includes(`coupon=${code}`) ||
    l.includes(`discount=${code}`) || l.includes(`ref=${code}`) || l.includes(`aff=${code}`) ||
    l.includes(`/discount/${code}`) || l.includes(`/p/${code}`)
}

const checkUrl = async (url: string): Promise<{ status: number; finalUrl: string; codeMayBeInvalid?: boolean }> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UpScrub/1.0; +https://github.com/yt-audit)' }
    })

    clearTimeout(timeout)

    if (res.status === 405) {
      const c2 = new AbortController()
      const t2 = setTimeout(() => c2.abort(), REQUEST_TIMEOUT_MS)
      const res2 = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: c2.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UpScrub/1.0; +https://github.com/yt-audit)' }
      })
      clearTimeout(t2)
      const finalUrl = res2.url
      const code = extractPromoCode(url)
      const codeMayBeInvalid = code && !codeStillInUrl(finalUrl, code) ? true : undefined
      return { status: res2.status, finalUrl, codeMayBeInvalid }
    }

    const finalUrl = res.url
    const code = extractPromoCode(url)
    const codeMayBeInvalid = code && !codeStillInUrl(finalUrl, code) ? true : undefined
    return { status: res.status, finalUrl, codeMayBeInvalid }
  } catch {
    return { status: 0, finalUrl: url }
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  const executing: Promise<void>[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item === undefined) continue
    const p = fn(item, i)
    const e = p.then(() => { executing.splice(executing.indexOf(e), 1) })
    executing.push(e)
    if (executing.length >= concurrency) await Promise.race(executing)
  }
  await Promise.all(executing)
}

export async function runLinkCheck(
  checks: Array<{ url: string; videoIds: string[] }>
): Promise<LinkCheckResult[]> {
  const urlToVideoIds = new Map<string, string[]>()
  for (const { url, videoIds } of checks) {
    const normalized = url.trim()
    if (!normalized.startsWith('http')) continue
    const existing = urlToVideoIds.get(normalized) ?? []
    const merged = [...new Set([...existing, ...videoIds])]
    urlToVideoIds.set(normalized, merged)
  }

  const uniqueUrls = [...urlToVideoIds.keys()]
  if (uniqueUrls.length === 0) return []

  const linkResults: LinkCheckResult[] = []
  const { getCachedLinkResult, setCachedLinkResult } = await import('./linkCacheService')

  const cacheResults = await Promise.all(
    uniqueUrls.map(async (url) => {
      const cached = await getCachedLinkResult(url)
      return { url, cached }
    })
  )

  const toFetch: string[] = []
  for (const { url, cached } of cacheResults) {
    if (cached) {
      linkResults.push({
        ...cached,
        videoIds: urlToVideoIds.get(url) ?? [],
        codeMayBeInvalid: cached.codeMayBeInvalid ? true : undefined
      })
    } else {
      toFetch.push(url)
    }
  }

  await runWithConcurrency(toFetch, CONCURRENCY, async (url, index) => {
    if (!url) return

    const { status, finalUrl, codeMayBeInvalid } = await checkUrl(url)

    const requestedNorm = normalizeUrl(url)
    const finalNorm = normalizeUrl(finalUrl)
    const redirected = requestedNorm !== finalNorm

    let category: 'dead' | 'redirected' | 'ok' = 'ok'
    if (status === 0 || isDeadStatus(status)) {
      category = 'dead'
    } else if (redirected) {
      category = 'redirected'
    }

    const result: LinkCheckResult = {
      url,
      requestedUrl: url,
      finalUrl,
      status: status || 0,
      redirected,
      videoIds: urlToVideoIds.get(url) ?? [],
      category,
      ...(codeMayBeInvalid && { codeMayBeInvalid })
    }
    linkResults.push(result)
    await setCachedLinkResult(url, result)

    if (index < toFetch.length - 1 && (index + 1) % CONCURRENCY === 0) {
      await sleep(DELAY_BETWEEN_BATCHES_MS)
    }
  })

  return linkResults
}
