import { getUserById, getLinkedChannels } from '~~/server/service/userService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session?.user?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const user = await getUserById(userId)
  if (!user) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, message: 'User not found' })
  }

  const channels = await getLinkedChannels(userId)
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl
    },
    linkedChannels: channels.map(c => ({
      id: c.id,
      channelId: c.channelId,
      handle: c.handle,
      channelTitle: c.channelTitle
    }))
  }
})
