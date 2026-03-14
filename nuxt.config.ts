import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
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
    maxVideosToFetch: Number(process.env.MAX_VIDEOS_TO_FETCH) || 200,
    auditCacheTtlHours: Number(process.env.AUDIT_CACHE_TTL_HOURS) || 24,
    linkCacheTtlHours: Number(process.env.LINK_CACHE_TTL_HOURS) || 24,
    commentsFetchMaxVideos: Number(process.env.COMMENTS_FETCH_MAX_VIDEOS) || 50,
  },
});