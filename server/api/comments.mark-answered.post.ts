import { getAnsweredCommentIds, markCommentAsAnswered, unmarkCommentAsAnswered } from '~~/server/service/answeredCommentsService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Sign in to mark comments' })
  }

  const body = await readBody<{ commentId: string; answered: boolean }>(event)
  if (!body?.commentId || typeof body.commentId !== 'string') {
    throw createError({ statusCode: 400, message: 'commentId is required' })
  }

  const answered = body.answered !== false

  if (answered) {
    await markCommentAsAnswered(userId, body.commentId)
  } else {
    await unmarkCommentAsAnswered(userId, body.commentId)
  }

  const answeredCommentIds = await getAnsweredCommentIds(userId)
  return { answeredCommentIds }
})
