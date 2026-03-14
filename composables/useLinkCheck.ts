import { ref, computed } from 'vue'
import type { VideoDetails } from '~~/types/youtube'
import { getLinksToCheck, normalizeUrl } from '~~/utils/url'
import type { LinkCheckResult } from '~~/types/links'

const MS_PER_LINK = 200

export function useLinkCheck(
  videos: () => VideoDetails[],
  options: {
    userSponsors: () => string[]
    checkOnlyMySponsors: () => boolean
  }
) {
  const linkResults = ref<LinkCheckResult[]>([])
  const isCheckingLinks = ref(false)
  const linkCheckElapsed = ref(0)
  const linkCheckTotal = ref(0)
  const linkCheckError = ref('')
  let linkCheckTimer: ReturnType<typeof setInterval> | null = null

  const isUserSponsorLink = (url: string): boolean =>
    options.userSponsors().some(domain => url.toLowerCase().includes(domain))

  const allLinksCount = computed(() => {
    const seen = new Set<string>()
    videos().forEach(v => {
      getLinksToCheck(v.links).forEach(url => seen.add(url))
    })
    return seen.size
  })

  const linksToCheckCount = computed(() => {
    const sponsors = options.userSponsors()
    if (!options.checkOnlyMySponsors() || sponsors.length === 0) return allLinksCount.value
    const seen = new Set<string>()
    videos().forEach(v => {
      getLinksToCheck(v.links)
        .filter(isUserSponsorLink)
        .forEach(url => seen.add(url))
    })
    return seen.size
  })

  const linkCheckProgress = computed(() => {
    if (!isCheckingLinks.value || linkCheckTotal.value === 0) return ''
    const estTotalMs = linkCheckTotal.value * MS_PER_LINK
    const remaining = Math.max(0, estTotalMs - linkCheckElapsed.value)
    return `~${Math.ceil(remaining / 1000)}s remaining (${linkCheckTotal.value} links)`
  })

  const linkCheckProgressPercent = computed(() => {
    if (!isCheckingLinks.value || linkCheckTotal.value === 0) return 0
    const estTotalMs = linkCheckTotal.value * MS_PER_LINK
    return Math.min(99, (linkCheckElapsed.value / estTotalMs) * 100)
  })

  const deadLinksCount = computed(() => linkResults.value.filter(r => r.category === 'dead').length)
  const redirectedLinksCount = computed(() => linkResults.value.filter(r => r.category === 'redirected').length)
  const okLinksCount = computed(() => linkResults.value.filter(r => r.category === 'ok').length)
  const codeIssuesCount = computed(() => linkResults.value.filter(r => r.codeMayBeInvalid).length)

  const getLinkResult = (url: string): LinkCheckResult | undefined =>
    linkResults.value.find(r => normalizeUrl(r.url) === normalizeUrl(url))

  const hasCodeIssue = (url: string): boolean =>
    getLinkResult(url)?.codeMayBeInvalid ?? false

  const linkClass = (url: string, defaultColor: string): string => {
    const r = getLinkResult(url)
    if (!r) return defaultColor
    if (r.category === 'dead') return 'text-error-text line-through'
    if (r.category === 'redirected') return 'text-alert-text'
    return defaultColor
  }

  const runLinkCheck = async () => {
    linkCheckError.value = ''

    const urlToVideoIds = new Map<string, string[]>()

    videos().forEach(video => {
      getLinksToCheck(video.links)
        .filter(url => !options.checkOnlyMySponsors() || options.userSponsors().length === 0 || isUserSponsorLink(url))
        .forEach(url => {
          const existing = urlToVideoIds.get(url) ?? []
          if (!existing.includes(video.id)) {
            existing.push(video.id)
            urlToVideoIds.set(url, existing)
          }
        })
    })

    const checks = [...urlToVideoIds.entries()].map(([url, videoIds]) => ({ url, videoIds }))
    const totalLinks = checks.length

    if (totalLinks === 0) return

    isCheckingLinks.value = true
    linkCheckTotal.value = totalLinks
    linkCheckElapsed.value = 0

    linkCheckTimer = setInterval(() => {
      linkCheckElapsed.value += 200
    }, 200)

    try {
      const res = await $fetch<{ linkResults: LinkCheckResult[] }>('/api/check-links', {
        method: 'POST',
        body: { checks }
      })
      linkResults.value = res.linkResults ?? []
    } catch (e: unknown) {
      const err = e as { statusCode?: number; data?: { message?: string }; message?: string }
      const status = err?.statusCode ?? (err as { status?: number })?.status
      const msg = err?.data?.message ?? err?.message ?? 'Link check failed'

      if (status === 429) {
        linkCheckError.value = 'Rate limit reached. Please wait a minute and try again.'
      } else if (err instanceof Error && err.message?.toLowerCase().includes('fetch')) {
        linkCheckError.value = 'Network error. Check your connection and try again.'
      } else {
        linkCheckError.value = msg
      }
    } finally {
      isCheckingLinks.value = false
      linkCheckElapsed.value = 0
      if (linkCheckTimer) {
        clearInterval(linkCheckTimer)
        linkCheckTimer = null
      }
    }
  }

  const retryLinkCheck = () => {
    linkCheckError.value = ''
    runLinkCheck()
  }

  const exportCsv = () => {
    const rows = linkResults.value.flatMap(r =>
      (r.videoIds ?? []).map(vid => ({
        url: r.url,
        status: r.status,
        category: r.category,
        redirected: r.redirected,
        codeMayBeInvalid: r.codeMayBeInvalid ?? false,
        videoId: vid
      }))
    )
    const csv = [
      'url,status,category,redirected,codeMayBeInvalid,videoId',
      ...rows.map(r => `"${r.url.replace(/"/g, '""')}",${r.status},${r.category},${r.redirected},${r.codeMayBeInvalid},${r.videoId}`)
    ].join('\n')
    downloadFile(csv, `yt-audit-links-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
  }

  const exportJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      linkResults: linkResults.value
    }
    downloadFile(JSON.stringify(data, null, 2), `yt-audit-links-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
  }

  const clearCache = async () => {
    try {
      await $fetch('/api/link-cache', { method: 'DELETE' })
      linkResults.value = []
    } catch {
      linkResults.value = []
    }
  }

  return {
    linkResults,
    isCheckingLinks,
    linkCheckProgress,
    linkCheckProgressPercent,
    deadLinksCount,
    redirectedLinksCount,
    okLinksCount,
    codeIssuesCount,
    linkCheckError,
    allLinksCount,
    linksToCheckCount,
    getLinkResult,
    hasCodeIssue,
    linkClass,
    runLinkCheck,
    retryLinkCheck,
    exportCsv,
    exportJson,
    clearCache
  }
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
