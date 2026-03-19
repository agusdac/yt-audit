import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core'

export const wrongComments = pgTable(
  'wrong_comments',
  {
    userId: text('user_id').notNull(),
    commentId: text('comment_id').notNull()
  },
  (t) => [primaryKey({ columns: [t.userId, t.commentId] })]
)
