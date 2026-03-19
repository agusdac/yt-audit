import crypto from 'node:crypto'
import { setTierFromLemonSqueezy } from '../../service/tierService'

interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string
    custom_data?: { user_id?: string }
  }
  data?: {
    id?: string
    type?: string
    attributes?: {
      status?: string
      customer_id?: number
      renews_at?: string
      ends_at?: string
    }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const signingSecret = config.lemonSqueezySigningSecret
  if (!signingSecret) {
    console.error('[lemon-squeezy webhook] LEMON_SQUEEZY_SIGNING_SECRET not configured')
    throw createError({ statusCode: 500, message: 'Webhook not configured' })
  }

  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'x-signature')
  if (!rawBody || !signature) {
    throw createError({ statusCode: 400, message: 'Missing body or signature' })
  }

  const hmac = crypto.createHmac('sha256', signingSecret)
  const digest = hmac.update(rawBody).digest('hex')
  const digestBuf = Buffer.from(digest, 'utf8')
  const sigBuf = Buffer.from(signature, 'utf8')
  if (digestBuf.length !== sigBuf.length || !crypto.timingSafeEqual(digestBuf, sigBuf)) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  const payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload
  const eventName = payload.meta?.event_name
  const userId = payload.meta?.custom_data?.user_id

  if (!userId) {
    console.warn('[lemon-squeezy webhook] No user_id in custom_data, skipping')
    return { received: true }
  }

  const attrs = payload.data?.attributes
  const status = attrs?.status
  const customerId = attrs?.customer_id?.toString()
  const currentPeriodEnd = (attrs?.renews_at ?? attrs?.ends_at)
    ? new Date(attrs.renews_at ?? attrs.ends_at!)
    : undefined

  const isSubscriptionEvent = eventName?.startsWith('subscription_')
  const subscriptionId = isSubscriptionEvent ? payload.data?.id?.toString() : undefined

  const isActive = status === 'active' || status === 'on_trial'

  switch (eventName) {
    case 'order_created':
      if (attrs?.status === 'paid') {
        await setTierFromLemonSqueezy(userId, {
          customerId,
          status: 'active'
        })
      }
      break
    case 'subscription_created':
    case 'subscription_updated':
      await setTierFromLemonSqueezy(userId, {
        customerId,
        subscriptionId,
        currentPeriodEnd,
        status: status ?? (isActive ? 'active' : 'cancelled')
      })
      break
    case 'subscription_cancelled':
    case 'subscription_expired':
    case 'subscription_paused':
      await setTierFromLemonSqueezy(userId, {
        customerId,
        subscriptionId: undefined,
        currentPeriodEnd,
        status: 'cancelled'
      })
      break
    default:
      console.log(`[lemon-squeezy webhook] Unhandled event: ${eventName}`)
  }

  return { received: true }
})
