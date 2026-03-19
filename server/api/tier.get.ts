import {
  getOrCreateSubscription,
  getEffectiveTier,
  getManageSubscriptionUrl
} from '../service/tierService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const config = useRuntimeConfig(event)
  const sub = await getOrCreateSubscription(userId)
  const tier = await getEffectiveTier(userId)
  const auditsLimit = tier === 'pro' ? null : 1

  return {
    tier,
    auditsUsedThisMonth: sub.auditsUsedThisMonth ?? 0,
    auditsLimit,
    auditsResetAt: sub.auditsResetAt?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    canManageSubscription: tier === 'pro' && !!config.lemonSqueezyBillingUrl,
    manageSubscriptionUrl: getManageSubscriptionUrl(config.lemonSqueezyBillingUrl || '')
  }
})
