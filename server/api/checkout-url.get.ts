export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const config = useRuntimeConfig(event)
  const apiKey = config.lemonSqueezyApiKey
  const storeId = config.lemonSqueezyStoreId
  const variantId = config.lemonSqueezyProVariantId
  const siteUrl = config.public?.siteUrl || getRequestURL(event).origin

  if (!apiKey || !storeId || !variantId) {
    throw createError({
      statusCode: 503,
      message: 'Checkout is not configured. Please contact support.'
    })
  }

  const res = await $fetch<{ data: { attributes: { url: string } } }>(
    'https://api.lemonsqueezy.com/v1/checkouts',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json'
      },
      body: {
        data: {
          type: 'checkouts',
          attributes: {
            product_options: {
              redirect_url: `${siteUrl}/settings?upgraded=1`,
              receipt_button_text: 'Back to UpScrub'
            },
            checkout_options: {
              embed: false,
              media: false,
              logo: true,
              desc: true,
              discount: true
            },
            checkout_data: {
              custom: { user_id: userId }
            }
          },
          relationships: {
            store: { data: { type: 'stores', id: String(storeId) } },
            variant: { data: { type: 'variants', id: String(variantId) } }
          }
        }
      }
    }
  ).catch((err) => {
    console.error('[checkout-url] Lemon Squeezy API error:', err)
    throw createError({ statusCode: 503, message: 'Failed to create checkout session' })
  })

  const url = res?.data?.attributes?.url
  if (!url) {
    throw createError({ statusCode: 503, message: 'Failed to create checkout session' })
  }

  return { url }
})
