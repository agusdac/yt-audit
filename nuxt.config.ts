import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '0 9 * * *': ['sendProgrammedEmails'] // every day at 9:00
    }
  },
  modules: ['nuxt-auth-utils', '@pinia/nuxt'],
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  runtimeConfig: {
    public: {
      autoRunAuditOnLogin: process.env.AUTO_RUN_AUDIT_ON_LOGIN !== 'false',
      auditCacheTtlHours: Number(process.env.AUDIT_CACHE_TTL_HOURS) || 24,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@upscrub.com',
      supportUrl: process.env.SUPPORT_URL || '',
      proPriceDisplay: process.env.PRO_PRICE_DISPLAY || '$19/mo',
    },
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || ''
      }
    },
    ytApiKey: process.env.YT_API_KEY,
    adminPassword: process.env.ADMIN_PASSWORD || '',
    apiKey: process.env.API_KEY || '',
    apiRateLimitPerMin: Number(process.env.API_RATE_LIMIT_PER_MIN) || 60,
    scheduledAuditSecret: process.env.SCHEDULED_AUDIT_SECRET || '',
    scheduledAuditChannels: (process.env.SCHEDULED_AUDIT_CHANNELS || '').split(',').map(h => h.trim()).filter(Boolean),
    auditWebhookUrl: process.env.AUDIT_WEBHOOK_URL || '',
    notificationEmail: process.env.NOTIFICATION_EMAIL || '',
    maxVideosToFetch: Number(process.env.MAX_VIDEOS_TO_FETCH) || 200,
    auditCacheTtlHours: Number(process.env.AUDIT_CACHE_TTL_HOURS) || 24,
    linkCacheTtlHours: Number(process.env.LINK_CACHE_TTL_HOURS) || 24,
    scoreCacheTtlHours: Number(process.env.SCORE_CACHE_TTL_HOURS) || 24,
    commentsFetchMaxVideos: Number(process.env.COMMENTS_FETCH_MAX_VIDEOS) || 50,
    detectIntentViaHf: process.env.DETECT_INTENT_VIA_HF === 'true',
    hfToken: process.env.HF_TOKEN || '',
    lemonSqueezyApiKey: process.env.LEMON_SQUEEZY_API_KEY || '',
    lemonSqueezySigningSecret: process.env.LEMON_SQUEEZY_SIGNING_SECRET || '',
    lemonSqueezyStoreId: process.env.LEMON_SQUEEZY_STORE_ID || '',
    lemonSqueezyProVariantId: process.env.LEMON_SQUEEZY_PRO_VARIANT_ID || '',
    lemonSqueezyBillingUrl: process.env.LEMON_SQUEEZY_BILLING_URL || '',
    bulkLinksRateLimitPerMin: Number(process.env.BULK_LINKS_RATE_LIMIT) || 5,
    replyBulkRateLimitPerMin: Number(process.env.REPLY_BULK_RATE_LIMIT) || 10,
  },
});