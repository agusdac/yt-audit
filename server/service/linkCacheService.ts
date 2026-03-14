import type { LinkCheckResult } from '~~/types/links'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { linkCache } from '~~/server/db/schemas/linkCache'

function getCacheTtlSeconds(): number {
  const config = useRuntimeConfig()
  const hours = Number(config.linkCacheTtlHours) || 24
  return hours * 60 * 60
}

export async function getCachedLinkResult(url: string): Promise<LinkCheckResult | null> {
  const ttlSeconds = getCacheTtlSeconds()
  const minCachedAt = Math.floor(Date.now() / 1000) - ttlSeconds
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
