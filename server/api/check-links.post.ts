import { extractPromoCode } from '~~/utils/url'

const CONCURRENCY = 5
const DELAY_BETWEEN_BATCHES_MS = 150
const REQUEST_TIMEOUT_MS = 10000

const isDeadStatus = (status: number): boolean =>
  status === 404 || (status >= 500 && status < 600)

const normalizeForCompare = (url: string): string => {
  try {
    const u = new URL(url)
    u.hash = ''
    return u.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}

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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YTAudit/1.0; +https://github.com/yt-audit)' }
    })

    clearTimeout(timeout)

    if (res.status === 405) {
      const c2 = new AbortController()
      const t2 = setTimeout(() => c2.abort(), REQUEST_TIMEOUT_MS)
      const res2 = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: c2.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YTAudit/1.0; +https://github.com/yt-audit)' }
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

/** Run tasks with concurrency limit */
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

export default defineEventHandler(async (event) => {
  const body = await readBody<{ checks: Array<{ url: string; videoIds: string[] }> }>(event)

  if (!body?.checks || !Array.isArray(body.checks)) {
    throw createError({ statusCode: 400, message: 'Missing or invalid checks array' })
  }

  const urlToVideoIds = new Map<string, string[]>()
  for (const { url, videoIds } of body.checks) {
    const normalized = url.trim()
    if (!normalized.startsWith('http')) continue
    const existing = urlToVideoIds.get(normalized) ?? []
    const merged = [...new Set([...existing, ...videoIds])]
    urlToVideoIds.set(normalized, merged)
  }

  const uniqueUrls = [...urlToVideoIds.keys()]
  if (uniqueUrls.length === 0) return { linkResults: [] }

  const linkResults: Array<{
    url: string
    requestedUrl: string
    finalUrl: string
    status: number
    redirected: boolean
    videoIds: string[]
    category: 'dead' | 'redirected' | 'ok'
    codeMayBeInvalid?: boolean
  }> = []

  await runWithConcurrency(uniqueUrls, CONCURRENCY, async (url, index) => {
    if (!url) return

    const { status, finalUrl, codeMayBeInvalid } = await checkUrl(url)

    const requestedNorm = normalizeForCompare(url)
    const finalNorm = normalizeForCompare(finalUrl)
    const redirected = requestedNorm !== finalNorm

    let category: 'dead' | 'redirected' | 'ok' = 'ok'
    if (status === 0 || isDeadStatus(status)) {
      category = 'dead'
    } else if (redirected) {
      category = 'redirected'
    }

    linkResults.push({
      url,
      requestedUrl: url,
      finalUrl,
      status: status || 0,
      redirected,
      videoIds: urlToVideoIds.get(url) ?? [],
      category,
      ...(codeMayBeInvalid && { codeMayBeInvalid })
    })

    if (index < uniqueUrls.length - 1 && (index + 1) % CONCURRENCY === 0) {
      await sleep(DELAY_BETWEEN_BATCHES_MS)
    }
  })

  return { linkResults }
})
