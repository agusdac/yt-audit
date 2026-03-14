export default defineNuxtRouteMiddleware(async () => {
  const { data } = await useFetch<{ valid: boolean }>('/api/admin/session')
  if (!data.value?.valid) {
    return navigateTo('/admin/login')
  }
})
