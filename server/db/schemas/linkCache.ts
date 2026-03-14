import { pgTable, text, integer } from 'drizzle-orm/pg-core'

export const linkCache = pgTable('link_cache', {
  url: text('url').primaryKey(),
  result: text('result').notNull(),
  cachedAt: integer('cached_at').notNull()
})
