import { pgTable, text, real, primaryKey, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core'

export const creatorSettings = pgTable('creator_settings', {
  userId: text('user_id').primaryKey(),
  cpmSponsor: real('cpm_sponsor'),
  ctrAffiliate: real('ctr_affiliate'),
  convAffiliate: real('conv_affiliate'),
  avgCommission: real('avg_commission'),
  sponsorDomains: jsonb('sponsor_domains'),
  scheduledAuditEnabled: boolean('scheduled_audit_enabled').default(false),
  scheduledAuditFrequency: text('scheduled_audit_frequency'), // 'weekly' | 'monthly'
  lastScheduledAuditAt: timestamp('last_scheduled_audit_at')
})
