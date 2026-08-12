<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { defaultValueFor, operatorsFor } from './tree'
import type { QueryCondition, QueryDateRange, QueryField, QueryOption, QueryScalar } from './types'

defineOptions({ name: 'QueryConditionEditor' })

/** Internal props for editing a single condition node. */
interface QueryConditionEditorProps {
  /** Condition represented by this editor instance. */
  condition: QueryCondition
  /** Fields available for selection. */
  fields: QueryField[]
}

interface QueryConditionEditorEmits {
  /** Emitted with an immutable replacement for this condition. */
  'update:condition': [condition: QueryCondition]
  /** Requests removal of this condition from its parent group. */
  remove: []
}

const props = defineProps<QueryConditionEditorProps>()
const emit = defineEmits<QueryConditionEditorEmits>()

const search = ref('')
const loadedOptions = ref<QueryOption[]>([])
const optionState = ref<'idle' | 'loading' | 'loaded' | 'empty' | 'error'>('idle')

const field = computed(() => props.fields.find((item) => item.key === props.condition.field))
const operators = computed(() => operatorsFor(field.value))
const options = computed(() => field.value?.options ?? loadedOptions.value)
const isDynamicSelect = computed(() => field.value?.type === 'select' && Boolean(field.value.loadOptions))
const isDateRange = computed(() => field.value?.type === 'date' && props.condition.operator === 'between')
const dateRange = computed<QueryDateRange>(() =>
  Array.isArray(props.condition.value) ? props.condition.value : [String(props.condition.value ?? ''), ''],
)
const scalarValue = computed(() =>
  Array.isArray(props.condition.value) ? props.condition.value[0] : props.condition.value,
)

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
  const operator = (event.target as HTMLSelectElement).value
  const currentValue = props.condition.value

  if (field.value?.type === 'date' && operator === 'between') {
    update({
      operator,
      value: Array.isArray(currentValue) ? currentValue : [String(currentValue ?? ''), ''],
    })
    return
  }

  update({ operator, value: Array.isArray(currentValue) ? currentValue[0] : currentValue })
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

function onDateRangeChange(index: 0 | 1, event: Event) {
  const value: QueryDateRange = [...dateRange.value]
  value[index] = (event.target as HTMLInputElement).value
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
    // Loaded options belong to one field and must not leak into another selection.
    search.value = ''
    loadedOptions.value = []
    optionState.value = 'idle'
    if (field.value?.loadOptions) void loadDynamicOptions()
  },
  { immediate: true },
)
</script>

<template>
  <div class="query-condition" :data-node-id="condition.id">
    <label class="query-control">
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

    <label class="query-control">
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

    <div v-if="field?.type === 'select'" class="query-value query-select-value">
      <label class="query-control">
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

      <div v-if="isDynamicSelect" class="query-option-loader">
        <label class="query-control query-search-control">
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

    <label v-else-if="field?.type === 'boolean'" class="query-control query-value">
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

    <div v-else-if="isDateRange" class="query-value query-date-range">
      <label class="query-control">
        <span>Start date</span>
        <input
          type="date"
          :value="dateRange[0]"
          aria-label="Start date"
          data-testid="start-date-input"
          @input="onDateRangeChange(0, $event)"
        />
      </label>
      <label class="query-control">
        <span>End date</span>
        <input
          type="date"
          :value="dateRange[1]"
          aria-label="End date"
          data-testid="end-date-input"
          @input="onDateRangeChange(1, $event)"
        />
      </label>
    </div>

    <label v-else class="query-control query-value">
      <span>Value</span>
      <input
        :type="field?.type === 'date' ? 'date' : field?.type === 'number' ? 'number' : 'text'"
        :value="scalarValue ?? ''"
        :placeholder="field?.placeholder"
        aria-label="Value"
        data-testid="value-input"
        @input="onValueChange"
      />
    </label>

    <button type="button" class="query-remove" aria-label="Remove condition" @click="emit('remove')">
      Remove
    </button>
  </div>
</template>

<style scoped lang="scss">
.query-condition,
.query-option-loader {
  display: flex;
  align-items: end;
  gap: 0.75rem;
}

.query-condition {
  flex-wrap: wrap;
  padding: 0.75rem;
  border-left: 3px solid var(--query-border);
  background: var(--query-muted-surface);
}

.query-option-loader {
  flex-wrap: wrap;
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

.query-value {
  flex: 1 1 12rem;
}

.query-select-value {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.75rem;
}

.query-date-range {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  > .query-control {
    flex: 1 1 10rem;
  }
}

.query-search-control {
  min-width: 8rem;
}

input,
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
  .query-condition,
  .query-control,
  .query-value,
  .query-select-value,
  .query-date-range {
    width: 100%;
  }
}
</style>
