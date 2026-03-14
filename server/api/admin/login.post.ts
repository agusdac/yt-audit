export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const config = useRuntimeConfig(event)

  if (!config.adminPassword) {
    throw createError({ statusCode: 503, message: 'Admin login not configured' })
  }

  if (body?.password === config.adminPassword) {
    const { setAdminSession } = await import('~~/server/utils/adminAuth')
    setAdminSession(event, config)
    return { ok: true }
  }

  throw createError({ statusCode: 401, message: 'Invalid password' })
})
