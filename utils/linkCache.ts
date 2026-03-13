import type { LinkCheckResult } from '~~/types/links'
import { normalizeUrl } from './url'

/** TODO: Replace with DB when logging is added */
const STORAGE_KEY = 'yt-audit-link-cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface CachedLinkResult {
  result: LinkCheckResult
  cachedAt: number
}

function loadCache(): Record<string, CachedLinkResult> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, CachedLinkResult>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // quota exceeded, etc.
  }
}

export function getCachedResult(url: string): LinkCheckResult | null {
  const key = normalizeUrl(url)
  const cache = loadCache()
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    delete cache[key]
    saveCache(cache)
    return null
  }
  return entry.result
}

export function setCachedResult(url: string, result: LinkCheckResult) {
  const key = normalizeUrl(url)
  const cache = loadCache()
  cache[key] = { result, cachedAt: Date.now() }
  saveCache(cache)
}

export function getCachedResults(urls: string[]): LinkCheckResult[] {
  const results: LinkCheckResult[] = []
  const cache = loadCache()
  const now = Date.now()
  for (const url of urls) {
    const key = normalizeUrl(url)
    const entry = cache[key]
    if (entry && now - entry.cachedAt <= CACHE_TTL_MS) {
      results.push(entry.result)
    }
  }
  return results
}

export function clearLinkCache() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
