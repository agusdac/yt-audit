import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core'

export const answeredComments = pgTable(
  'answered_comments',
  {
    userId: text('user_id').notNull(),
    commentId: text('comment_id').notNull()
  },
  (t) => [primaryKey({ columns: [t.userId, t.commentId] })]
)
