<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { defaultValueFor, operatorsFor } from './tree'
import type {
  QueryCondition,
  QueryDateRange,
  QueryField,
  QueryMultiValue,
  QueryOption,
  QueryOptionValue,
  QueryScalar,
} from './types'

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
const isMultiSelectOpen = ref(false)
const multiSelectSearch = ref('')
const multiSelectRoot = ref<HTMLElement>()
const multiSelectTrigger = ref<HTMLButtonElement>()
const multiSelectPopover = ref<HTMLElement>()
const multiSelectSearchInput = ref<HTMLInputElement>()

const field = computed(() => props.fields.find((item) => item.key === props.condition.field))
const operators = computed(() => operatorsFor(field.value))
const options = computed(() => field.value?.options ?? loadedOptions.value)
const isDynamicSelect = computed(() => field.value?.type === 'select' && Boolean(field.value.loadOptions))
const isMultiSelect = computed(() => field.value?.type === 'select' && field.value.multiple === true)
const isDateRange = computed(() => field.value?.type === 'date' && props.condition.operator === 'between')
const dateRange = computed<QueryDateRange>(() => {
  const value = props.condition.value
  return Array.isArray(value)
    ? [String(value[0] ?? ''), String(value[1] ?? '')]
    : [String(value ?? ''), '']
})
const scalarValue = computed(() =>
  Array.isArray(props.condition.value) ? props.condition.value[0] : props.condition.value,
)
const selectedValues = computed<QueryMultiValue>(() =>
  isMultiSelect.value && Array.isArray(props.condition.value) ? props.condition.value : [],
)
const selectedOptions = computed(() =>
  selectedValues.value.map((value) => ({
    value,
    label: options.value.find((option) => Object.is(option.value, value))?.label ?? String(value),
  })),
)
const filteredMultiSelectOptions = computed(() => {
  const query = multiSelectSearch.value.trim().toLocaleLowerCase()
  if (!query) return options.value
  return options.value.filter((option) =>
    `${option.label} ${String(option.value)}`.toLocaleLowerCase().includes(query),
  )
})
const multiSelectListboxId = computed(() => `query-multi-select-${props.condition.id}`)

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
      value: Array.isArray(currentValue)
        ? [String(currentValue[0] ?? ''), String(currentValue[1] ?? '')]
        : [String(currentValue ?? ''), ''],
    })
    return
  }

  if (isMultiSelect.value) {
    update({ operator, value: Array.isArray(currentValue) ? currentValue : [] })
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

function isOptionSelected(value: QueryOptionValue) {
  return selectedValues.value.some((selectedValue) => Object.is(selectedValue, value))
}

function toggleSelectedOption(option: QueryOption) {
  update({
    value: isOptionSelected(option.value)
      ? selectedValues.value.filter((value) => !Object.is(value, option.value))
      : [...selectedValues.value, option.value],
  })
}

function selectAllVisibleOptions() {
  const values = [...selectedValues.value]
  for (const option of filteredMultiSelectOptions.value) {
    if (!values.some((value) => Object.is(value, option.value))) values.push(option.value)
  }
  update({ value: values })
}

function clearSelectedOptions() {
  update({ value: [] })
}

function removeSelectedValue(valueToRemove: QueryOptionValue) {
  update({
    value: selectedValues.value.filter((value) => !Object.is(value, valueToRemove)),
  })
}

function focusMultiSelectOption(index: number) {
  void nextTick(() => {
    const optionElements = multiSelectRoot.value?.querySelectorAll<HTMLButtonElement>('[role="option"]')
    optionElements?.[index]?.focus()
  })
}

function openMultiSelect(focusIndex?: number) {
  isMultiSelectOpen.value = true
  if (focusIndex !== undefined) focusMultiSelectOption(focusIndex)
  else void nextTick(() => multiSelectSearchInput.value?.focus())
}

function closeMultiSelect(restoreFocus = false) {
  isMultiSelectOpen.value = false
  multiSelectSearch.value = ''
  if (restoreFocus) void nextTick(() => multiSelectTrigger.value?.focus())
}

function toggleMultiSelect() {
  if (isMultiSelectOpen.value) closeMultiSelect()
  else openMultiSelect()
}

function onMultiSelectTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const lastIndex = Math.max(filteredMultiSelectOptions.value.length - 1, 0)
    openMultiSelect(event.key === 'ArrowDown' ? 0 : lastIndex)
  } else if (event.key === 'Escape' && isMultiSelectOpen.value) {
    event.preventDefault()
    closeMultiSelect()
  }
}

function onMultiSelectOptionKeydown(event: KeyboardEvent, index: number) {
  const lastIndex = filteredMultiSelectOptions.value.length - 1
  let nextIndex: number | undefined

  if (event.key === 'ArrowDown') nextIndex = index === lastIndex ? 0 : index + 1
  if (event.key === 'ArrowUp') nextIndex = index === 0 ? lastIndex : index - 1
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = lastIndex

  if (nextIndex !== undefined) {
    event.preventDefault()
    focusMultiSelectOption(nextIndex)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeMultiSelect(true)
  }
}

function onMultiSelectSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' && filteredMultiSelectOptions.value.length > 0) {
    event.preventDefault()
    focusMultiSelectOption(0)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeMultiSelect(true)
  }
}

function closeMultiSelectFromOutside(event: Event) {
  const target = event.target as Node
  const targetElement = target instanceof Element ? target : target.parentElement
  const clickedToken = targetElement?.closest('.query-token')
  const isInsideInteractiveArea =
    multiSelectTrigger.value?.contains(target) ||
    multiSelectPopover.value?.contains(target) ||
    (clickedToken && multiSelectRoot.value?.contains(clickedToken))

  if (!isInsideInteractiveArea) closeMultiSelect()
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
    isMultiSelectOpen.value = false
    multiSelectSearch.value = ''
    if (field.value?.loadOptions) void loadDynamicOptions()
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('pointerdown', closeMultiSelectFromOutside)
  document.addEventListener('focusin', closeMultiSelectFromOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeMultiSelectFromOutside)
  document.removeEventListener('focusin', closeMultiSelectFromOutside)
})
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
      <div v-if="isMultiSelect" ref="multiSelectRoot" class="query-multi-select">
        <span class="query-control-label">Value</span>
        <button
          ref="multiSelectTrigger"
          type="button"
          class="query-multi-select-trigger"
          aria-haspopup="listbox"
          :aria-expanded="isMultiSelectOpen"
          :aria-controls="multiSelectListboxId"
          :disabled="optionState === 'loading'"
          data-testid="multi-select-trigger"
          @click="toggleMultiSelect"
          @keydown="onMultiSelectTriggerKeydown"
        >
          <span>
            {{
              selectedValues.length > 0
                ? `${selectedValues.length} selected`
                : field.placeholder ?? 'Select values'
            }}
          </span>
          <span class="query-multi-select-chevron" aria-hidden="true">⌄</span>
        </button>

        <div
          v-if="isMultiSelectOpen"
          ref="multiSelectPopover"
          class="query-multi-select-popover"
        >
          <label class="query-multi-select-search">
            <span class="query-visually-hidden">Search values</span>
            <input
              ref="multiSelectSearchInput"
              v-model="multiSelectSearch"
              type="search"
              placeholder="Search values"
              aria-label="Search values"
              @keydown="onMultiSelectSearchKeydown"
            />
          </label>
          <div class="query-multi-select-actions">
            <button
              type="button"
              :disabled="filteredMultiSelectOptions.length === 0"
              @click="selectAllVisibleOptions"
            >
              Select all
            </button>
            <button
              type="button"
              :disabled="selectedValues.length === 0"
              @click="clearSelectedOptions"
            >
              Clear all
            </button>
          </div>
          <div
            :id="multiSelectListboxId"
            class="query-multi-select-listbox"
            role="listbox"
            aria-label="Values"
            aria-multiselectable="true"
          >
            <button
              v-for="(option, index) in filteredMultiSelectOptions"
              :key="`${typeof option.value}:${String(option.value)}`"
              type="button"
              class="query-multi-select-option"
              role="option"
              :aria-selected="isOptionSelected(option.value)"
              @click="toggleSelectedOption(option)"
              @keydown="onMultiSelectOptionKeydown($event, index)"
            >
              <span class="query-option-checkbox" aria-hidden="true">
                {{ isOptionSelected(option.value) ? '✓' : '' }}
              </span>
              <span>{{ option.label }}</span>
            </button>
            <p v-if="filteredMultiSelectOptions.length === 0" class="query-option-empty">
              No matching values.
            </p>
          </div>
        </div>

        <div
          v-if="selectedOptions.length > 0"
          class="query-tokens"
          role="list"
          aria-label="Selected values"
        >
          <span
            v-for="option in selectedOptions"
            :key="`${typeof option.value}:${String(option.value)}`"
            class="query-token"
            role="listitem"
          >
            <span>{{ option.label }}</span>
            <button
              type="button"
              class="query-token-remove"
              :aria-label="`Remove ${option.label}`"
              @click="removeSelectedValue(option.value)"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </span>
        </div>
      </div>

      <label v-else class="query-control">
        <span>Value</span>
        <select
          :value="scalarValue ?? ''"
          aria-label="Value"
          data-testid="value-select"
          :disabled="optionState === 'loading'"
          @change="onValueChange"
        >
          <option value="">{{ field.placeholder ?? 'Select a value' }}</option>
          <option
            v-for="option in options"
            :key="`${typeof option.value}:${String(option.value)}`"
            :value="option.value"
          >
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
  gap: 0.75rem;
}

.query-condition {
  align-items: start;
  flex-wrap: wrap;
  padding: 0.75rem;
  border-left: 3px solid var(--query-border);
  background: var(--query-muted-surface);
}

.query-option-loader {
  align-items: end;
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

.query-multi-select {
  position: relative;
  display: grid;
  flex: 1 1 14rem;
  gap: 0.25rem;
  min-width: 0;
}

.query-control-label {
  color: var(--query-muted-text);
  font-size: 0.8rem;
}

.query-multi-select-trigger {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-inline: 0.5rem;
  text-align: left;
}

.query-multi-select-chevron {
  transition: transform 120ms ease;
}

.query-multi-select-trigger[aria-expanded='true'] .query-multi-select-chevron {
  transform: rotate(180deg);
}

.query-multi-select-popover {
  position: absolute;
  z-index: 10;
  top: 3.75rem;
  left: 0;
  width: max(100%, 16rem);
  max-width: min(24rem, calc(100vw - 2rem));
  overflow: hidden;
  border: 1px solid var(--query-border);
  border-radius: 3px;
  background: var(--query-surface);
  box-shadow: 0 0.5rem 1.25rem rgb(0 0 0 / 16%);
}

.query-multi-select-listbox {
  max-height: 15rem;
  overflow-y: auto;
  padding: 0.25rem;
}

.query-multi-select-search {
  display: block;
  padding: 0.5rem;
  border-bottom: 1px solid var(--query-border);
}

.query-multi-select-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--query-border);

  > button {
    min-height: 1.75rem;
    padding: 0.15rem 0.4rem;
    border: 0;
    background: transparent;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
}

.query-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.query-multi-select-option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.55rem;
  border: 0;
  background: transparent;
  text-align: left;

  &:hover,
  &:focus-visible {
    background: var(--query-muted-surface);
  }
}

.query-option-checkbox {
  display: inline-grid;
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 1.1rem;
  place-items: center;
  border: 1px solid var(--query-border);
  border-radius: 2px;
  font-size: 0.8rem;
  line-height: 1;
}

.query-option-empty {
  margin: 0;
  padding: 0.6rem;
  color: var(--query-muted-text);
}

.query-tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-width: 0;
  margin-top: 0.25rem;
}

.query-token {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.25rem 0.2rem 0.55rem;
  border: 1px solid var(--query-border);
  border-radius: 999px;
  background: var(--query-surface);

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.query-token-remove {
  min-height: 1.5rem;
  padding: 0 0.4rem;
  border: 0;
  border-radius: 999px;
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
  .query-date-range,
  .query-option-loader,
  .query-multi-select {
    width: 100%;
  }

  .query-option-loader > button,
  .query-remove {
    width: 100%;
  }
}
</style>
