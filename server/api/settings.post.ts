import type { CreatorRevenueSettings, ScheduledAuditFrequency } from '~~/server/service/creatorSettingsService'
import { setCreatorSettings } from '~~/server/service/creatorSettingsService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Sign in to update settings' })
  }

  const body = await readBody<CreatorRevenueSettings & { scheduledAuditEnabled?: boolean; scheduledAuditFrequency?: string }>(event)
  const settings: CreatorRevenueSettings = {}
  if (typeof body?.cpmSponsor === 'number' && body.cpmSponsor >= 0) settings.cpmSponsor = body.cpmSponsor
  if (typeof body?.ctrAffiliate === 'number' && body.ctrAffiliate >= 0 && body.ctrAffiliate <= 1) settings.ctrAffiliate = body.ctrAffiliate
  if (typeof body?.convAffiliate === 'number' && body.convAffiliate >= 0 && body.convAffiliate <= 1) settings.convAffiliate = body.convAffiliate
  if (typeof body?.avgCommission === 'number' && body.avgCommission >= 0) settings.avgCommission = body.avgCommission
  if (Array.isArray(body?.sponsorDomains)) settings.sponsorDomains = body.sponsorDomains.filter((d): d is string => typeof d === 'string').map((d) => d.trim().toLowerCase()).filter(Boolean)
  if (typeof body?.scheduledAuditEnabled === 'boolean') settings.scheduledAuditEnabled = body.scheduledAuditEnabled
  if (body?.scheduledAuditFrequency === 'weekly' || body?.scheduledAuditFrequency === 'monthly') settings.scheduledAuditFrequency = body.scheduledAuditFrequency as ScheduledAuditFrequency

  await setCreatorSettings(userId, settings)
  return { settings }
})
