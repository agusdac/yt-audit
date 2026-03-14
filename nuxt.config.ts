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
  },
});