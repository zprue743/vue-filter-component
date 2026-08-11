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
