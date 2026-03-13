const DELAY_MS = 400
const REQUEST_TIMEOUT_MS = 10000

const isDeadStatus = (status: number): boolean =>
  status === 404 || (status >= 500 && status < 600)

const checkUrl = async (url: string): Promise<{ status: number }> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const res = await fetch(url, {
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
      return { status: res2.status }
    }

    return { status: res.status }
  } catch {
    return { status: 0 }
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  if (uniqueUrls.length === 0) return { deadLinks: [] }

  const deadLinks: Array<{ url: string; status: number; videoIds: string[] }> = []

  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i]
    if (!url) continue
    const { status } = await checkUrl(url)

    if (status === 0 || isDeadStatus(status)) {
      deadLinks.push({
        url,
        status: status || 0,
        videoIds: urlToVideoIds.get(url) ?? []
      })
    }

    if (i < uniqueUrls.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  return { deadLinks }
})
