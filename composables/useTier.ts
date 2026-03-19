export interface TierData {
  tier: 'free' | 'pro'
  auditsUsedThisMonth: number
  auditsLimit: number | null
  auditsResetAt: string | null
  currentPeriodEnd: string | null
  canManageSubscription: boolean
  manageSubscriptionUrl: string
}

export const useTier = () => {
  const data = ref<TierData | null>(null)
  const isLoading = ref(true)

  const fetchTier = async () => {
    isLoading.value = true
    try {
      data.value = await $fetch<TierData>('/api/tier')
    } catch {
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  const refresh = () => fetchTier()

  onMounted(() => fetchTier())

  return {
    tier: computed(() => data.value?.tier ?? 'free'),
    auditsUsedThisMonth: computed(() => data.value?.auditsUsedThisMonth ?? 0),
    auditsLimit: computed(() => data.value?.auditsLimit ?? null),
    auditsResetAt: computed(() => data.value?.auditsResetAt ?? null),
    currentPeriodEnd: computed(() => data.value?.currentPeriodEnd ?? null),
    canManageSubscription: computed(() => data.value?.canManageSubscription ?? false),
    manageSubscriptionUrl: computed(() => data.value?.manageSubscriptionUrl ?? ''),
    isLoading: readonly(isLoading),
    refresh
  }
}
