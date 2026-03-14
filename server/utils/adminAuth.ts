import { getCookie, setCookie, deleteCookie } from 'h3'
import { createHmac } from 'node:crypto'

const ADMIN_COOKIE = 'yt_audit_admin'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(config: { adminPassword: string }) {
  return config.adminPassword || 'change-me-in-production'
}

export function setAdminSession(event: any, config: { adminPassword: string }) {
  const payload = 'admin'
  const sig = createHmac('sha256', getSecret(config)).update(payload).digest('hex')
  setCookie(event, ADMIN_COOKIE, `${payload}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  })
}

export function clearAdminSession(event: any) {
  deleteCookie(event, ADMIN_COOKIE, { path: '/' })
}

export function isAdminSessionValid(event: any, config: { adminPassword: string }): boolean {
  const cookie = getCookie(event, ADMIN_COOKIE)
  if (!cookie) return false
  const [payload, sig] = cookie.split('.')
  if (payload !== 'admin' || !sig) return false
  const expected = createHmac('sha256', getSecret(config)).update(payload).digest('hex')
  return sig === expected
}
