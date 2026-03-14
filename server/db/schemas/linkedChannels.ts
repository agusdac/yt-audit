import { pgTable, text, serial, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const linkedChannels = pgTable('linked_channels', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').notNull(),
  handle: text('handle').notNull(),
  channelTitle: text('channel_title'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
