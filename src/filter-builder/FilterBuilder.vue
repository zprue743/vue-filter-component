<script setup lang="ts">
import FilterGroupEditor from './FilterGroupEditor.vue'
import type { FilterField, FilterGroup } from './types'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    modelValue: FilterGroup
    fields: FilterField[]
    ariaLabel?: string
  }>(),
  { ariaLabel: 'Filter builder' },
)

const emit = defineEmits<{
  'update:modelValue': [filter: FilterGroup]
}>()
</script>

<template>
  <section class="filter-builder" :aria-label="ariaLabel" v-bind="$attrs">
    <FilterGroupEditor
      :group="modelValue"
      :fields="fields"
      root
      @update:group="emit('update:modelValue', $event)"
    />
  </section>
</template>
