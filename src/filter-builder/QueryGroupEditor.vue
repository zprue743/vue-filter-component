<script setup lang="ts">
import { computed } from 'vue'
import { createCondition, createGroup } from './tree'
import QueryConditionEditor from './QueryConditionEditor.vue'
import type { QueryCondition, QueryField, QueryGroup } from './types'

defineOptions({ name: 'QueryGroupEditor' })

/** Internal props for rendering one recursive group in the query tree. */
interface QueryGroupEditorProps {
  /** Group represented by this editor instance. */
  group: QueryGroup
  /** Fields available to conditions created within this group. */
  fields: QueryField[]
  /** Marks the top-level group, which cannot be removed. */
  root?: boolean
  /** Zero-based nesting depth, where the root group is zero. */
  depth?: number
  /** Maximum number of group levels allowed beneath the root. */
  maxNestedGroupDepth?: number
}

interface QueryGroupEditorEmits {
  /** Emitted with an immutable replacement for this group. */
  'update:group': [group: QueryGroup]
  /** Requests removal of this group from its parent. */
  remove: []
}

const props = withDefaults(defineProps<QueryGroupEditorProps>(), { depth: 0 })
const emit = defineEmits<QueryGroupEditorEmits>()
const canAddGroup = computed(
  () => props.maxNestedGroupDepth === undefined || props.depth < props.maxNestedGroupDepth,
)

function updateChild(index: number, child: QueryCondition | QueryGroup) {
  const children = [...props.group.children]
  children[index] = child
  emit('update:group', { ...props.group, children })
}

function removeChild(index: number) {
  emit('update:group', {
    ...props.group,
    children: props.group.children.filter((_, childIndex) => childIndex !== index),
  })
}

function addCondition() {
  emit('update:group', {
    ...props.group,
    children: [...props.group.children, createCondition(props.fields)],
  })
}

function addGroup() {
  if (!canAddGroup.value) return
  emit('update:group', {
    ...props.group,
    children: [...props.group.children, createGroup()],
  })
}

function onCombinatorChange(event: Event) {
  emit('update:group', {
    ...props.group,
    combinator: (event.target as HTMLSelectElement).value as QueryGroup['combinator'],
  })
}
</script>

<template>
  <fieldset class="query-group" :data-node-id="group.id">
    <legend class="query-group-heading">{{ root ? 'Filter criteria' : 'Nested group' }}</legend>

    <div class="query-group-toolbar">
      <label class="query-control query-combinator">
        <span>Match</span>
        <select
          :value="group.combinator"
          aria-label="Group operator"
          data-testid="combinator-select"
          @change="onCombinatorChange"
        >
          <option value="and">All conditions (AND)</option>
          <option value="or">Any condition (OR)</option>
        </select>
      </label>

      <div class="query-group-actions">
        <button type="button" :disabled="fields.length === 0" @click="addCondition">
          Add condition
        </button>
        <button
          type="button"
          :disabled="!canAddGroup"
          :title="canAddGroup ? undefined : 'Maximum nested group depth reached'"
          @click="addGroup"
        >
          Add group
        </button>
        <button v-if="!root" type="button" aria-label="Remove group" @click="emit('remove')">
          Remove group
        </button>
      </div>
    </div>

    <p v-if="group.children.length === 0" class="query-empty" role="status">
      No criteria yet. Add a condition or group to begin.
    </p>

    <div v-else class="query-group-children">
      <template v-for="(child, index) in group.children" :key="child.id">
        <QueryGroupEditor
          v-if="child.kind === 'group'"
          :group="child"
          :fields="fields"
          :depth="depth + 1"
          :max-nested-group-depth="maxNestedGroupDepth"
          @update:group="updateChild(index, $event)"
          @remove="removeChild(index)"
        />
        <QueryConditionEditor
          v-else
          :condition="child"
          :fields="fields"
          @update:condition="updateChild(index, $event)"
          @remove="removeChild(index)"
        />
      </template>
    </div>
  </fieldset>
</template>

<style scoped lang="scss">
.query-group {
  min-width: 0;
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--query-border);
  border-radius: 4px;
  background: var(--query-surface);
}

.query-group-heading {
  padding: 0 0.35rem;
  font-weight: 600;
}

.query-group-toolbar,
.query-group-actions {
  display: flex;
  align-items: end;
  gap: 0.75rem;
}

.query-group-toolbar {
  flex-wrap: wrap;
  justify-content: space-between;
}

.query-group-actions {
  flex-wrap: wrap;
}

.query-group-children {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;

  > .query-group {
    margin-left: 1rem;
    background: var(--query-muted-surface);
  }
}

.query-control {
  display: grid;
  gap: 0.25rem;
  min-width: 10rem;

  > span {
    color: var(--query-muted-text);
    font-size: 0.8rem;
  }
}

select,
button {
  min-height: 2.25rem;
  border: 1px solid var(--query-border);
  border-radius: 3px;
  background: var(--query-surface);
  color: inherit;
  font: inherit;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}

select {
  width: 100%;
  padding: 0.35rem 0.5rem;
}

button {
  padding: 0.35rem 0.7rem;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.query-empty {
  margin: 1rem 0 0;
  color: var(--query-muted-text);
}

@media (max-width: 680px) {
  .query-control {
    width: 100%;
  }

  .query-group-children > .query-group {
    margin-left: 0;
  }
}
</style>
