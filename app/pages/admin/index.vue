<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

await navigateTo('/admin/dashboard', { replace: true })
</script>

<template>
  <div />
</template>
