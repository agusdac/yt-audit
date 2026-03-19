import { eq } from 'drizzle-orm'
import { db } from '../db'
import { subscriptions } from '../db/schemas/subscriptions'

export type Tier = 'free' | 'pro'

export async function getOrCreateSubscription(userId: string) {
  const row = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId)
  })
  if (row) return row
  const [inserted] = await db
    .insert(subscriptions)
    .values({
      userId,
      tier: 'free',
      auditsUsedThisMonth: 0
    })
    .returning()
  return inserted!
}

export async function getEffectiveTier(userId: string): Promise<Tier> {
  const row = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId)
  })
  if (!row) return 'free'
  const override = row.adminOverrideTier as Tier | null
  if (override === 'free' || override === 'pro') return override
  return row.tier as Tier
}

export async function canRunAudit(userId: string): Promise<boolean> {
  const tier = await getEffectiveTier(userId)
  if (tier === 'pro') return true
  const row = await getOrCreateSubscription(userId)
  const now = new Date()
  if (row.auditsResetAt && row.auditsResetAt < now) {
    await db
      .update(subscriptions)
      .set({
        auditsUsedThisMonth: 0,
        auditsResetAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: now
      })
      .where(eq(subscriptions.userId, userId))
    return true
  }
  return (row.auditsUsedThisMonth ?? 0) < 1
}

export async function incrementAuditsUsed(userId: string): Promise<void> {
  const row = await getOrCreateSubscription(userId)
  const now = new Date()
  let auditsUsed = row.auditsUsedThisMonth ?? 0
  let auditsResetAt = row.auditsResetAt

  if (auditsResetAt && auditsResetAt < now) {
    auditsUsed = 0
    auditsResetAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  } else if (!auditsResetAt) {
    auditsResetAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }

  await db
    .update(subscriptions)
    .set({
      auditsUsedThisMonth: auditsUsed + 1,
      auditsResetAt,
      updatedAt: now
    })
    .where(eq(subscriptions.userId, userId))
}

export function getMaxVideosForTier(tier: Tier): number {
  return tier === 'pro' ? 200 : 10
}

export interface LemonSqueezySubscriptionData {
  customerId?: string
  subscriptionId?: string
  currentPeriodEnd?: Date
  status?: string
}

export async function setTierFromLemonSqueezy(
  userId: string,
  data: LemonSqueezySubscriptionData
): Promise<void> {
  await getOrCreateSubscription(userId)
  const isActive = data.status === 'active' || data.status === 'on_trial'
  await db
    .update(subscriptions)
    .set({
      tier: isActive ? 'pro' : 'free',
      lemonCustomerId: data.customerId ?? undefined,
      lemonSubscriptionId: isActive ? data.subscriptionId : null,
      currentPeriodEnd: data.currentPeriodEnd ?? undefined,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.userId, userId))
}

export async function setAdminOverride(userId: string, tier: Tier | null): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      adminOverrideTier: tier,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.userId, userId))
}

export function getManageSubscriptionUrl(billingUrl: string): string {
  return billingUrl || ''
}
