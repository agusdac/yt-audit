import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { answeredComments } from '~~/server/db/schemas/answeredComments'

export async function getAnsweredCommentIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ commentId: answeredComments.commentId })
    .from(answeredComments)
    .where(eq(answeredComments.userId, userId))
  return rows.map((r) => r.commentId)
}

export async function markCommentAsAnswered(userId: string, commentId: string): Promise<void> {
  await db
    .insert(answeredComments)
    .values({ userId, commentId })
    .onConflictDoNothing()
}

export async function unmarkCommentAsAnswered(userId: string, commentId: string): Promise<void> {
  await db
    .delete(answeredComments)
    .where(and(eq(answeredComments.userId, userId), eq(answeredComments.commentId, commentId)))
}
