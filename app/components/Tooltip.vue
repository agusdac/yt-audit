<template>
  <div
    class="group/tooltip relative inline"
    :class="[triggerClass]"
  >
    <slot />
    <div
      v-if="content"
      class="tooltip-content absolute z-50 px-4 py-3 text-sm text-text-primary leading-relaxed min-w-[260px] max-w-[360px] rounded-button shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity duration-150 pointer-events-none"
      :class="placementClasses"
    >
      {{ content }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    content?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    triggerClass?: string
  }>(),
  { placement: 'top', triggerClass: '' }
)

const placementClasses = computed(() => {
  switch (props.placement) {
    case 'top':
      return 'left-1/2 -translate-x-1/2 bottom-full mb-2'
    case 'bottom':
      return 'left-1/2 -translate-x-1/2 top-full mt-2'
    case 'left':
      return 'right-full mr-2 top-1/2 -translate-y-1/2'
    case 'right':
      return 'left-full ml-2 top-1/2 -translate-y-1/2'
    default:
      return 'left-1/2 -translate-x-1/2 bottom-full mb-2'
  }
})
</script>
