<script setup lang="ts">
import QueryGroupEditor from './QueryGroupEditor.vue'
import type { QueryField, QueryGroup } from './types'

defineOptions({ name: 'QueryBuilder' })

/** Props accepted by the public query-builder component. */
interface QueryBuilderProps {
  /** Current query tree. Prefer binding this prop with `v-model`. */
  modelValue: QueryGroup
  /** Fields, operators, and selectable values available to the user. */
  fields: QueryField[]
  /** Maximum number of nested group levels beneath the root. Omit for no limit. */
  maxNestedGroupDepth?: number
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
  <section class="query-builder" :aria-label="ariaLabel">
    <QueryGroupEditor
      :group="modelValue"
      :fields="fields"
      :max-nested-group-depth="maxNestedGroupDepth"
      :depth="0"
      root
      @update:group="emit('update:modelValue', $event)"
    />
  </section>
</template>

<style scoped lang="scss">
.query-builder {
  --query-border: #b8b8b8;
  --query-surface: #fff;
  --query-muted-surface: #f5f5f5;
  --query-text: #222;
  --query-muted-text: #666;
  color: var(--query-text);
  font: 14px/1.4 system-ui, sans-serif;

  &,
  :deep(*),
  :deep(*::before),
  :deep(*::after) {
    box-sizing: border-box;
  }
}
</style>
