export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = getHeader(event, 'x-scheduled-audit-secret')
  if (!config.scheduledAuditSecret || secret !== config.scheduledAuditSecret) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const channels = config.scheduledAuditChannels as string[]
  if (!channels.length) {
    return { ok: true, message: 'No channels configured', count: 0, videos: [] }
  }

  const { runAudit } = await import('../utils/runAudit')
  const res = await runAudit(channels, config.ytApiKey)

  const webhookUrl = config.auditWebhookUrl as string
  if (webhookUrl && res.count > 0) {
    try {
      await $fetch(webhookUrl, {
        method: 'POST',
        body: {
          event: 'audit_complete',
          count: res.count,
          channels,
          timestamp: new Date().toISOString()
        }
      })
    } catch {
      // ignore webhook errors
    }
  }

  return { ok: true, count: res.count, videos: res.videos }
})
