import { pgTable, text, uuid, timestamp, integer } from 'drizzle-orm/pg-core'
import { users } from './users'

export const subscriptions = pgTable('subscriptions', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  tier: text('tier').notNull().default('free'), // 'free' | 'pro'
  lemonCustomerId: text('lemon_customer_id'),
  lemonSubscriptionId: text('lemon_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  auditsUsedThisMonth: integer('audits_used_this_month').default(0).notNull(),
  auditsResetAt: timestamp('audits_reset_at'),
  adminOverrideTier: text('admin_override_tier'), // 'free' | 'pro' | null
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
