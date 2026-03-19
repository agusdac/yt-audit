import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { wrongComments } from '~~/server/db/schemas/wrongComments'

export const getWrongCommentIds = async (userId: string): Promise<string[]> => {
  const rows = await db
    .select({ commentId: wrongComments.commentId })
    .from(wrongComments)
    .where(eq(wrongComments.userId, userId))
  return rows.map((r) => r.commentId)
}

export const markCommentAsWrong = async (userId: string, commentId: string): Promise<void> => {
  await db
    .insert(wrongComments)
    .values({ userId, commentId })
    .onConflictDoNothing()
}

export const unmarkCommentAsWrong = async (userId: string, commentId: string): Promise<void> => {
  await db
    .delete(wrongComments)
    .where(and(eq(wrongComments.userId, userId), eq(wrongComments.commentId, commentId)))
}
