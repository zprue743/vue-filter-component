<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { defaultValueFor, operatorsFor } from './tree'
import type { QueryCondition, QueryField, QueryOption, QueryScalar } from './types'

defineOptions({ name: 'QueryConditionEditor' })

const props = defineProps<{
  condition: QueryCondition
  fields: QueryField[]
}>()

const emit = defineEmits<{
  'update:condition': [condition: QueryCondition]
  remove: []
}>()

const search = ref('')
const loadedOptions = ref<QueryOption[]>([])
const optionState = ref<'idle' | 'loading' | 'loaded' | 'empty' | 'error'>('idle')

const field = computed(() => props.fields.find((item) => item.key === props.condition.field))
const operators = computed(() => operatorsFor(field.value))
const options = computed(() => field.value?.options ?? loadedOptions.value)
const isDynamicSelect = computed(() => field.value?.type === 'select' && Boolean(field.value.loadOptions))

function update(changes: Partial<QueryCondition>) {
  emit('update:condition', { ...props.condition, ...changes })
}

function onFieldChange(event: Event) {
  const key = (event.target as HTMLSelectElement).value
  const nextField = props.fields.find((item) => item.key === key)
  update({
    field: key,
    operator: operatorsFor(nextField)[0]?.value ?? '',
    value: defaultValueFor(nextField),
  })
}

function onOperatorChange(event: Event) {
  update({ operator: (event.target as HTMLSelectElement).value })
}

function onValueChange(event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  let value: QueryScalar = target.value

  if (field.value?.type === 'number') value = target.value === '' ? null : Number(target.value)
  if (field.value?.type === 'boolean') value = target.value === 'true'
  if (field.value?.type === 'select' && target.value !== '') {
    value = options.value.find((option) => String(option.value) === target.value)?.value ?? target.value
  }

  update({ value })
}

async function loadDynamicOptions() {
  const loader = field.value?.loadOptions
  if (!loader) return

  optionState.value = 'loading'
  loadedOptions.value = []
  try {
    const result = await loader(search.value || undefined)
    loadedOptions.value = result
    optionState.value = result.length > 0 ? 'loaded' : 'empty'
  } catch {
    optionState.value = 'error'
  }
}

watch(
  () => field.value?.key,
  () => {
    search.value = ''
    loadedOptions.value = []
    optionState.value = 'idle'
    if (field.value?.loadOptions) void loadDynamicOptions()
  },
  { immediate: true },
)
</script>

<template>
  <div class="filter-condition" :data-node-id="condition.id">
    <label class="filter-control">
      <span>Field</span>
      <select
        :value="condition.field"
        aria-label="Field"
        data-testid="field-select"
        @change="onFieldChange"
      >
        <option v-if="fields.length === 0" value="">No fields available</option>
        <option v-for="item in fields" :key="item.key" :value="item.key">
          {{ item.label }}
        </option>
      </select>
    </label>

    <label class="filter-control">
      <span>Operator</span>
      <select
        :value="condition.operator"
        aria-label="Operator"
        data-testid="operator-select"
        :disabled="operators.length === 0"
        @change="onOperatorChange"
      >
        <option v-if="operators.length === 0" value="">No operators available</option>
        <option v-for="operator in operators" :key="operator.value" :value="operator.value">
          {{ operator.label }}
        </option>
      </select>
    </label>

    <div v-if="field?.type === 'select'" class="filter-value filter-select-value">
      <label class="filter-control">
        <span>Value</span>
        <select
          :value="condition.value ?? ''"
          aria-label="Value"
          data-testid="value-select"
          :disabled="optionState === 'loading'"
          @change="onValueChange"
        >
          <option value="">{{ field.placeholder ?? 'Select a value' }}</option>
          <option v-for="option in options" :key="String(option.value)" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <div v-if="isDynamicSelect" class="filter-option-loader">
        <label class="filter-control filter-search-control">
          <span>Search values</span>
          <input v-model="search" type="search" aria-label="Search values" />
        </label>
        <button type="button" :disabled="optionState === 'loading'" @click="loadDynamicOptions">
          {{ optionState === 'loading' ? 'Loading…' : 'Load values' }}
        </button>
        <span v-if="optionState === 'empty'" role="status">No values found.</span>
        <span v-else-if="optionState === 'error'" role="alert">Values could not be loaded.</span>
      </div>
    </div>

    <label v-else-if="field?.type === 'boolean'" class="filter-control filter-value">
      <span>Value</span>
      <select
        :value="String(condition.value)"
        aria-label="Value"
        data-testid="value-select"
        @change="onValueChange"
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    </label>

    <label v-else class="filter-control filter-value">
      <span>Value</span>
      <input
        :type="field?.type === 'date' ? 'date' : field?.type === 'number' ? 'number' : 'text'"
        :value="condition.value ?? ''"
        :placeholder="field?.placeholder"
        aria-label="Value"
        data-testid="value-input"
        @input="onValueChange"
      />
    </label>

    <button type="button" class="filter-remove" aria-label="Remove condition" @click="emit('remove')">
      Remove
    </button>
  </div>
</template>

<style scoped lang="scss">
.filter-condition,
.filter-option-loader {
  display: flex;
  align-items: end;
  gap: 0.75rem;
}

.filter-condition {
  flex-wrap: wrap;
  padding: 0.75rem;
  border-left: 3px solid var(--filter-border);
  background: var(--filter-muted-surface);
}

.filter-option-loader {
  flex-wrap: wrap;
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

.filter-value {
  flex: 1 1 12rem;
}

.filter-select-value {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.75rem;
}

.filter-search-control {
  min-width: 8rem;
}

input,
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

input,
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

@media (max-width: 680px) {
  .filter-condition,
  .filter-control,
  .filter-value,
  .filter-select-value {
    width: 100%;
  }
}
</style>
