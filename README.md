# Vue Filter Builder

A small Vue 3 and TypeScript component for constructing nested reporting filter criteria. The component owns tree editing and rendering; the consuming application supplies every field, operator, and selectable value.

## Run the demo

```bash
npm install
npm run dev
```

Run checks with:

```bash
npm test
npm run build
```

## Component API

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  FilterBuilder,
  createGroup,
  type FilterField,
  type FilterGroup,
} from './filter-builder'

const fields: FilterField[] = [
  { key: 'name', label: 'Customer name', type: 'string' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
]

const filter = ref<FilterGroup>(createGroup())
</script>

<template>
  <FilterBuilder v-model="filter" :fields="fields" />
</template>
```

`FilterBuilder` accepts `modelValue`, `fields`, and an optional `ariaLabel`, and emits `update:modelValue`. Vue's `v-model` provides the concise form shown above. Normal attributes such as `class` and `style` are forwarded to the root element.

## Filter data

The output is a JSON-safe discriminated tree:

```ts
type FilterCondition = {
  id: string
  kind: 'condition'
  field: string
  operator: string
  value: string | number | boolean | null
}

type FilterGroup = {
  id: string
  kind: 'group'
  combinator: 'and' | 'or'
  children: Array<FilterCondition | FilterGroup>
}
```

The exported `createCondition`, `createGroup`, `addChild`, `removeNode`, `updateCondition`, and `updateGroup` helpers provide immutable tree operations and have no Vue dependency.

## Fields, values, and operators

Fields are always supplied by the consumer:

```ts
const fields: FilterField[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    type: 'number',
    operators: [
      { value: 'eq', label: 'Equals' },
      { value: 'gte', label: 'At least' },
    ],
  },
]
```

String, number, date, boolean, and select fields have small default operator sets. Supplying `operators` replaces the defaults for that field.

Select fields can receive static `options`, or a consumer-owned async loader:

```ts
const customerField: FilterField = {
  key: 'customerId',
  label: 'Customer',
  type: 'select',
  loadOptions: async (search) => {
    const response = await fetch(`/customers?q=${encodeURIComponent(search ?? '')}`)
    return response.json()
  },
}
```

The component calls the loader initially and when the user chooses **Load values**. It displays loading, empty, and error states. Fetching, authorization, caching, and response mapping remain the consumer's responsibility.

## Styling

Import `filter-builder/styles.css` for the minimal defaults, or import the component files and provide your own styles. All selectors use readable `filter-*` classes. The main neutral colors are exposed as CSS custom properties on `.filter-builder`:

```css
.my-filter-builder {
  --filter-border: #888;
  --filter-surface: #fff;
  --filter-muted-surface: #f7f7f7;
  --filter-text: #111;
  --filter-muted-text: #555;
}
```

## Deliberate limits

This foundation uses one value per condition and a small set of native controls. It does not generate SQL, validate backend semantics, cache loaded options, or include range/multi-select operators. Those behaviors can be added by a consuming application without changing the filter-tree shape.
