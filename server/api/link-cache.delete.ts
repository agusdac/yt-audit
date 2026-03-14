export default defineEventHandler(async () => {
  const { clearLinkCache } = await import('../service/linkCacheService')
  await clearLinkCache()
  return { ok: true }
})
