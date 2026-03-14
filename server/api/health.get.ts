export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    ok: true,
    ytApiKeyConfigured: !!config.ytApiKey
  }
})
