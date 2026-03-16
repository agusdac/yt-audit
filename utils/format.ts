export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Compact number format for likes/comments (e.g. 1.2K, 45K) */
export const formatCompact = formatViews

/** Short date for video published (e.g. "Jan 15, 2024") */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Full datetime for audit history */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

/** Video duration (e.g. "12:34" or "1:23:45") */
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Relative time (e.g. "5 minutes ago") */
export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${seconds >= 120 ? 's' : ''} ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${seconds >= 7200 ? 's' : ''} ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} day${seconds >= 172800 ? 's' : ''} ago`
  return formatDateTime(date.toISOString())
}
