import { pgTable, text, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core'

export const videoScoreCache = pgTable('video_score_cache', {
  videoId: text('video_id').primaryKey(),
  result: jsonb('result').notNull(),
  cachedAt: integer('cached_at').notNull()
})

export const channelScoreCache = pgTable('channel_score_cache', {
  handle: text('handle').primaryKey(),
  result: jsonb('result').notNull(),
  cachedAt: integer('cached_at').notNull()
})
