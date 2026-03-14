export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { isAdminSessionValid } = await import('~~/server/utils/adminAuth')
  return { valid: config.adminPassword ? isAdminSessionValid(event, config) : false }
})
