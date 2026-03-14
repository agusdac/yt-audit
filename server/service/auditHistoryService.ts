import { desc } from 'drizzle-orm'
import { db } from '~~/server/db'
import { auditHistory } from '~~/server/db/schemas/auditHistory'

export async function saveAuditHistory(handle: string, videoCount: number) {
  const createdAt = Math.floor(Date.now() / 1000)
  await db.insert(auditHistory).values({ handle, videoCount, createdAt })
}

export async function getAuditHistory(limit = 50) {
  const rows = await db.query.auditHistory.findMany({
    orderBy: desc(auditHistory.createdAt),
    limit
  })
  return rows.map(r => ({
    id: r.id,
    handle: r.handle,
    videoCount: r.videoCount,
    createdAt: new Date(r.createdAt * 1000).toISOString()
  }))
}
