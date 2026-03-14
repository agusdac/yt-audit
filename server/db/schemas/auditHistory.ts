import { pgTable, text, integer, serial } from 'drizzle-orm/pg-core'

export const auditHistory = pgTable('audit_history', {
  id: serial('id').primaryKey(),
  handle: text('handle').notNull(),
  videoCount: integer('video_count').notNull(),
  createdAt: integer('created_at').notNull()
})
