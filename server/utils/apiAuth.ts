import type { H3Event } from 'h3'

export function getApiKeyFromEvent(event: H3Event): string | null {
  const header = getHeader(event, 'x-api-key') ?? getHeader(event, 'authorization')
  if (!header) return null
  if (header.startsWith('Bearer ')) return header.slice(7).trim() || null
  return header.trim() || null
}

export function validateApiKey(event: H3Event, configuredKey: string | undefined): boolean {
  if (!configuredKey) return true
  const provided = getApiKeyFromEvent(event)
  return provided === configuredKey
}
