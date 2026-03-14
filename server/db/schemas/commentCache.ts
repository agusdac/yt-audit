import { pgTable, text, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core'

export const commentCache = pgTable(
  'comment_cache',
  {
    userId: text('user_id').notNull(),
    handlesHash: text('handles_hash').notNull(),
    comments: jsonb('comments').notNull(),
    cachedAt: integer('cached_at').notNull()
  },
  (t) => [primaryKey({ columns: [t.userId, t.handlesHash] })]
)
