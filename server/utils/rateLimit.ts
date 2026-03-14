const store = new Map<string, number[]>()
const WINDOW_MS = 60 * 1000
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

function cleanup() {
  const cutoff = Date.now() - WINDOW_MS
  for (const [key, timestamps] of store) {
    const filtered = timestamps.filter(t => t > cutoff)
    if (filtered.length === 0) store.delete(key)
    else store.set(key, filtered)
  }
}

let lastCleanup = Date.now()
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (Date.now() - lastCleanup > CLEANUP_INTERVAL_MS) {
      cleanup()
      lastCleanup = Date.now()
    }
  }, CLEANUP_INTERVAL_MS)
}

export function checkRateLimit(key: string, limit: number): { ok: boolean; retryAfter?: number } {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const timestamps = store.get(key) ?? []
  const recent = timestamps.filter(t => t > cutoff)
  if (recent.length >= limit) {
    const oldest = Math.min(...recent)
    return { ok: false, retryAfter: Math.ceil((oldest + WINDOW_MS - now) / 1000) }
  }
  recent.push(now)
  store.set(key, recent)
  return { ok: true }
}
