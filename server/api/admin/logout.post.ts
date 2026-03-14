export default defineEventHandler(async (event) => {
  const { clearAdminSession } = await import('~~/server/utils/adminAuth')
  clearAdminSession(event)
  return { ok: true }
})
