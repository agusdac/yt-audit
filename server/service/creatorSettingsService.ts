import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { creatorSettings } from '~~/server/db/schemas/creatorSettings'

export type ScheduledAuditFrequency = 'weekly' | 'monthly'

export interface CreatorRevenueSettings {
  cpmSponsor?: number
  ctrAffiliate?: number
  convAffiliate?: number
  avgCommission?: number
  sponsorDomains?: string[]
  scheduledAuditEnabled?: boolean
  scheduledAuditFrequency?: ScheduledAuditFrequency
}

export interface CreatorSettingsRow {
  userId: string
  cpmSponsor: number | null
  ctrAffiliate: number | null
  convAffiliate: number | null
  avgCommission: number | null
  sponsorDomains: unknown
  scheduledAuditEnabled: boolean | null
  scheduledAuditFrequency: string | null
  lastScheduledAuditAt: Date | null
}

export async function getCreatorSettings(userId: string): Promise<CreatorRevenueSettings | null> {
  const row = await db.query.creatorSettings.findFirst({
    where: eq(creatorSettings.userId, userId)
  })
  if (!row) return null
  const domains = row.sponsorDomains as string[] | null
  return {
    cpmSponsor: row.cpmSponsor ?? undefined,
    ctrAffiliate: row.ctrAffiliate ?? undefined,
    convAffiliate: row.convAffiliate ?? undefined,
    avgCommission: row.avgCommission ?? undefined,
    sponsorDomains: Array.isArray(domains) ? domains : undefined,
    scheduledAuditEnabled: row.scheduledAuditEnabled ?? undefined,
    scheduledAuditFrequency: (row.scheduledAuditFrequency === 'weekly' || row.scheduledAuditFrequency === 'monthly') ? row.scheduledAuditFrequency : undefined,
  }
}

export async function setCreatorSettings(userId: string, settings: CreatorRevenueSettings): Promise<void> {
  const setClause: Record<string, unknown> = {}
  if (settings.cpmSponsor !== undefined) setClause.cpmSponsor = settings.cpmSponsor
  if (settings.ctrAffiliate !== undefined) setClause.ctrAffiliate = settings.ctrAffiliate
  if (settings.convAffiliate !== undefined) setClause.convAffiliate = settings.convAffiliate
  if (settings.avgCommission !== undefined) setClause.avgCommission = settings.avgCommission
  if (settings.sponsorDomains !== undefined) setClause.sponsorDomains = settings.sponsorDomains ? JSON.stringify(settings.sponsorDomains) : null
  if (typeof settings.scheduledAuditEnabled === 'boolean') {
    setClause.scheduledAuditEnabled = settings.scheduledAuditEnabled
    if (settings.scheduledAuditEnabled === false) setClause.scheduledAuditFrequency = null
  }
  if (settings.scheduledAuditFrequency === 'weekly' || settings.scheduledAuditFrequency === 'monthly') {
    setClause.scheduledAuditFrequency = settings.scheduledAuditFrequency
  }

  const insertValues = {
    userId,
    cpmSponsor: setClause.cpmSponsor as number | null ?? null,
    ctrAffiliate: setClause.ctrAffiliate as number | null ?? null,
    convAffiliate: setClause.convAffiliate as number | null ?? null,
    avgCommission: setClause.avgCommission as number | null ?? null,
    sponsorDomains: setClause.sponsorDomains as string | null ?? null,
    scheduledAuditEnabled: (setClause.scheduledAuditEnabled as boolean) ?? false,
    scheduledAuditFrequency: setClause.scheduledAuditFrequency as string | null ?? null
  }

  await db
    .insert(creatorSettings)
    .values(insertValues)
    .onConflictDoUpdate({
      target: creatorSettings.userId,
      set: setClause as Record<string, unknown>
    })
}

export async function getUsersDueForScheduledAudit(): Promise<Array<{ userId: string; frequency: ScheduledAuditFrequency }>> {
  const rows = await db.query.creatorSettings.findMany({
    where: eq(creatorSettings.scheduledAuditEnabled, true),
    columns: { userId: true, scheduledAuditFrequency: true, lastScheduledAuditAt: true }
  })
  const valid = rows.filter((row) => row.scheduledAuditFrequency === 'weekly' || row.scheduledAuditFrequency === 'monthly')
  const now = new Date()
  const due: Array<{ userId: string; frequency: ScheduledAuditFrequency }> = []
  for (const row of valid) {
    const freq = row.scheduledAuditFrequency === 'weekly' || row.scheduledAuditFrequency === 'monthly' ? row.scheduledAuditFrequency : 'weekly'
    const last = row.lastScheduledAuditAt
    const daysSince = last ? (now.getTime() - last.getTime()) / (24 * 60 * 60 * 1000) : Infinity
    const threshold = freq === 'weekly' ? 7 : 28
    if (daysSince >= threshold) {
      due.push({ userId: row.userId, frequency: freq })
    }
  }
  return due
}

export async function setLastScheduledAuditAt(userId: string): Promise<void> {
  await db
    .update(creatorSettings)
    .set({ lastScheduledAuditAt: new Date() })
    .where(eq(creatorSettings.userId, userId))
}
