import type { LinkCheckResult } from '~~/types/links'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { linkCache } from '~~/server/db/schemas/linkCache'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function getCachedLinkResult(url: string): Promise<LinkCheckResult | null> {
  const minCachedAt = Math.floor(Date.now() / 1000) - CACHE_TTL_MS / 1000
  const row = await db.query.linkCache.findFirst({
    where: eq(linkCache.url, url),
    columns: { result: true, cachedAt: true }
  })
  if (!row || row.cachedAt < minCachedAt) return null
  return JSON.parse(row.result) as LinkCheckResult
}

export async function setCachedLinkResult(url: string, result: object) {
  const resultJson = JSON.stringify(result)
  const cachedAt = Math.floor(Date.now() / 1000)
  await db
    .insert(linkCache)
    .values({ url, result: resultJson, cachedAt })
    .onConflictDoUpdate({
      target: linkCache.url,
      set: { result: resultJson, cachedAt }
    })
}

export async function clearLinkCache() {
  await db.delete(linkCache)
}
