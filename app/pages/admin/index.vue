<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

await navigateTo('/admin/audit', { replace: true })
</script>

<template>
  <div />
</template>
