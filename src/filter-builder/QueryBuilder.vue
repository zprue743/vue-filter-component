<script setup lang="ts">
import QueryGroupEditor from './QueryGroupEditor.vue'
import type { QueryField, QueryGroup } from './types'

defineOptions({ name: 'QueryBuilder', inheritAttrs: false })

/** Props accepted by the public query-builder component. */
interface QueryBuilderProps {
  /** Current query tree. Prefer binding this prop with `v-model`. */
  modelValue: QueryGroup
  /** Fields, operators, and selectable values available to the user. */
  fields: QueryField[]
  /** Accessible name for the root section. Use `aria-label` in templates. */
  ariaLabel?: string
}

interface QueryBuilderEmits {
  /** Emitted with a new immutable query tree after every edit. */
  'update:modelValue': [query: QueryGroup]
}

withDefaults(
  defineProps<QueryBuilderProps>(),
  { ariaLabel: 'Query builder' },
)

const emit = defineEmits<QueryBuilderEmits>()
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
