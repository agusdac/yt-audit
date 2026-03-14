import { pgTable, text, integer, serial, real } from 'drizzle-orm/pg-core'

export const auditHistory = pgTable('audit_history', {
  id: serial('id').primaryKey(),
  handle: text('handle').notNull(),
  videoCount: integer('video_count').notNull(),
  deadLinksCount: integer('dead_links_count'),
  revenueLoss: real('revenue_loss'),
  createdAt: integer('created_at').notNull()
})
