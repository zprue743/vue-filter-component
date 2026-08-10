<script setup lang="ts">
import { createCondition, createGroup } from './tree'
import FilterConditionEditor from './FilterConditionEditor.vue'
import type { FilterCondition, FilterField, FilterGroup } from './types'

defineOptions({ name: 'FilterGroupEditor' })

const props = defineProps<{
  group: FilterGroup
  fields: FilterField[]
  root?: boolean
}>()

const emit = defineEmits<{
  'update:group': [group: FilterGroup]
  remove: []
}>()

function updateChild(index: number, child: FilterCondition | FilterGroup) {
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
    combinator: (event.target as HTMLSelectElement).value as FilterGroup['combinator'],
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
        <FilterGroupEditor
          v-if="child.kind === 'group'"
          :group="child"
          :fields="fields"
          @update:group="updateChild(index, $event)"
          @remove="removeChild(index)"
        />
        <FilterConditionEditor
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
