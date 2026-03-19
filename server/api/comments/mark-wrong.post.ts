import { markCommentAsWrong, unmarkCommentAsWrong } from '../../service/wrongCommentsService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody<{ commentId: string; wrong: boolean }>(event)
  if (!body?.commentId || typeof body.commentId !== 'string') {
    throw createError({ statusCode: 400, message: 'commentId is required' })
  }

  const wrong = body.wrong !== false

  if (wrong) {
    await markCommentAsWrong(userId, body.commentId)
  } else {
    await unmarkCommentAsWrong(userId, body.commentId)
  }

  return { ok: true }
})
