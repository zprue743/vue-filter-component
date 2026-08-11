<script setup lang="ts">
import QueryGroupEditor from './QueryGroupEditor.vue'
import type { QueryField, QueryGroup } from './types'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    modelValue: QueryGroup
    fields: QueryField[]
    ariaLabel?: string
  }>(),
  { ariaLabel: 'Filter builder' },
)

const emit = defineEmits<{
  'update:modelValue': [filter: QueryGroup]
}>()
</script>

<template>
  <section class="filter-builder" :aria-label="ariaLabel" v-bind="$attrs">
    <QueryGroupEditor
      :group="modelValue"
      :fields="fields"
      root
      @update:group="emit('update:modelValue', $event)"
    />
  </section>
</template>

<style scoped lang="scss">
.filter-builder {
  --filter-border: #b8b8b8;
  --filter-surface: #fff;
  --filter-muted-surface: #f5f5f5;
  --filter-text: #222;
  --filter-muted-text: #666;
  color: var(--filter-text);
  font: 14px/1.4 system-ui, sans-serif;

  &,
  :deep(*),
  :deep(*::before),
  :deep(*::after) {
    box-sizing: border-box;
  }
}
</style>
