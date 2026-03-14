import { pgTable, text, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core'

export const auditCache = pgTable('audit_cache', {
  userId: text('user_id').notNull(),
  handlesHash: text('handles_hash').notNull(),
  videos: jsonb('videos').notNull(),
  linkResults: jsonb('link_results').notNull(),
  cachedAt: integer('cached_at').notNull()
},
  (t) => [primaryKey({ columns: [t.userId, t.handlesHash] })]
)
