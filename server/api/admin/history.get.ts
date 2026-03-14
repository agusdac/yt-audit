export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { isAdminSessionValid } = await import('~~/server/utils/adminAuth')
  if (!config.adminPassword || !isAdminSessionValid(event, config)) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { getAuditHistory } = await import('~~/server/service/auditHistoryService')
  try {
    return await getAuditHistory(50)
  } catch {
    return []
  }
})
