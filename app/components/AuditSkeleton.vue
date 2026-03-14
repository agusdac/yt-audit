<template>
  <div class="space-y-4">
    <div v-for="i in 5" :key="i" class="rounded-card border border-border-default overflow-hidden">
      <div class="flex flex-col sm:flex-row gap-4 p-4">
        <div class="flex-shrink-0 w-full sm:w-48 aspect-video rounded-lg bg-border-default/30 animate-pulse" />
        <div class="flex-1 space-y-3">
          <div class="h-4 w-3/4 bg-border-default/30 rounded animate-pulse" />
          <div class="h-3 w-1/2 bg-border-default/30 rounded animate-pulse" />
          <div class="h-3 w-1/4 bg-border-default/30 rounded animate-pulse" />
          <div class="flex gap-2 mt-4">
            <div class="h-6 w-20 bg-border-default/30 rounded animate-pulse" />
            <div class="h-6 w-24 bg-border-default/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
