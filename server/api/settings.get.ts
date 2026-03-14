import { getCreatorSettings } from '~~/server/service/creatorSettingsService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Sign in to access settings' })
  }

  const settings = await getCreatorSettings(userId)
  return { settings: settings ?? {} }
})
