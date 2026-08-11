<script setup lang="ts">
import { createCondition, createGroup } from './tree'
import QueryConditionEditor from './QueryConditionEditor.vue'
import type { QueryCondition, QueryField, QueryGroup } from './types'

defineOptions({ name: 'QueryGroupEditor' })

const props = defineProps<{
  group: QueryGroup
  fields: QueryField[]
  root?: boolean
}>()

const emit = defineEmits<{
  'update:group': [group: QueryGroup]
  remove: []
}>()

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
  <fieldset class="filter-group" :data-node-id="group.id">
    <legend class="filter-group-heading">{{ root ? 'Filter criteria' : 'Nested group' }}</legend>

    <div class="filter-group-toolbar">
      <label class="filter-control filter-combinator">
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

      <div class="filter-group-actions">
        <button type="button" :disabled="fields.length === 0" @click="addCondition">
          Add condition
        </button>
        <button type="button" @click="addGroup">Add group</button>
        <button v-if="!root" type="button" aria-label="Remove group" @click="emit('remove')">
          Remove group
        </button>
      </div>
    </div>

    <p v-if="group.children.length === 0" class="filter-empty" role="status">
      No criteria yet. Add a condition or group to begin.
    </p>

    <div v-else class="filter-group-children">
      <template v-for="(child, index) in group.children" :key="child.id">
        <QueryGroupEditor
          v-if="child.kind === 'group'"
          :group="child"
          :fields="fields"
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
.filter-group {
  min-width: 0;
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--filter-border);
  border-radius: 4px;
  background: var(--filter-surface);
}

.filter-group-heading {
  padding: 0 0.35rem;
  font-weight: 600;
}

.filter-group-toolbar,
.filter-group-actions {
  display: flex;
  align-items: end;
  gap: 0.75rem;
}

.filter-group-toolbar {
  flex-wrap: wrap;
  justify-content: space-between;
}

.filter-group-actions {
  flex-wrap: wrap;
}

.filter-group-children {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;

  > .filter-group {
    margin-left: 1rem;
    background: var(--filter-muted-surface);
  }
}

.filter-control {
  display: grid;
  gap: 0.25rem;
  min-width: 10rem;

  > span {
    color: var(--filter-muted-text);
    font-size: 0.8rem;
  }
}

select,
button {
  min-height: 2.25rem;
  border: 1px solid var(--filter-border);
  border-radius: 3px;
  background: var(--filter-surface);
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

.filter-empty {
  margin: 1rem 0 0;
  color: var(--filter-muted-text);
}

@media (max-width: 680px) {
  .filter-control {
    width: 100%;
  }

  .filter-group-children > .filter-group {
    margin-left: 0;
  }
}
</style>
