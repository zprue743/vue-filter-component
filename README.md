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
  QueryBuilder,
  createGroup,
  type QueryField,
  type QueryGroup,
} from './filter-builder'

const fields: QueryField[] = [
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

const filter = ref<QueryGroup>(createGroup())
</script>

<template>
  <QueryBuilder v-model="filter" :fields="fields" />
</template>
```

`QueryBuilder` accepts `modelValue`, `fields`, an optional `ariaLabel` (`aria-label` in templates), and an optional `maxNestedGroupDepth`. It emits `update:modelValue`. Vue's `v-model` provides the concise form shown above. Normal attributes such as `class` and `style` are forwarded to the root element.

Nested groups default to a maximum depth of 15 beneath the root. Use `maxNestedGroupDepth` to choose a different limit. Existing groups still render; the limit only disables creating deeper groups:

```vue
<QueryBuilder
  v-model="filter"
  :fields="fields"
  :max-nested-group-depth="2"
/>
```

Here, the root is depth `0`, and users can create nested groups at depths `1` and `2`.

## Submitting a query

`v-model` and `fields` are the only required bindings. The application can send the current query tree to its backend with a normal JSON request:

```ts
import type { QueryGroup } from './filter-builder'

interface SubmitQueryRequest {
  query: QueryGroup
}

interface SubmitQueryResponse {
  id: string
  status: 'accepted'
}

export async function submitQuery(query: QueryGroup): Promise<SubmitQueryResponse> {
  const response = await fetch('/api/queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query } satisfies SubmitQueryRequest),
  })

  if (!response.ok) {
    throw new Error(`Query request failed with status ${response.status}`)
  }

  return response.json() as Promise<SubmitQueryResponse>
}
```

For example, a submit button can call `await submitQuery(query.value)`. A backend implementing `POST /api/queries` would receive a body shaped like `{ "query": QueryGroup }` and could return `202 Accepted` with `{ "id": "query-123", "status": "accepted" }`.

The backend must validate field keys, operators, values, nesting depth, and authorization before translating the query tree into SQL or another data-store query. It should never interpolate client-provided fields or operators directly into SQL.

## Filter data

The output is a JSON-safe discriminated tree:

```ts
type QueryCondition = {
  id: string
  kind: 'condition'
  field: string
  operator: string
  value: string | number | boolean | null
    | [startDate: string, endDate: string]
    | Array<string | number | boolean>
}

type QueryGroup = {
  id: string
  kind: 'group'
  combinator: 'and' | 'or'
  children: Array<QueryCondition | QueryGroup>
}
```

The exported `createCondition`, `createGroup`, `addChild`, `removeNode`, `updateCondition`, and `updateGroup` helpers provide immutable tree operations and have no Vue dependency.

## Fields, values, and operators

Fields are always supplied by the consumer:

```ts
const fields: QueryField[] = [
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
Date fields include a `between` operator. Its condition value is an inclusive two-date tuple such as `['2026-08-01', '2026-08-31']`.

Set `multiple: true` on a select field to display selected options as removable tokens. Multi-select fields use `in` and `not_in` by default and store an array of option values:

```ts
const statusField: QueryField = {
  key: 'status',
  label: 'Status',
  type: 'select',
  multiple: true,
  showBulkActions: true,
  options: [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
  ],
}
```

The searchable multi-select menu stays open while options are toggled. Set `showBulkActions: true` to display **Select all** and **Clear all**; Select all applies to the currently visible search results, while Clear all removes every selection. Users can close the menu with the trigger, Escape, by tabbing away, or by clicking elsewhere. The trigger keeps a stable position while removable tokens wrap beneath it, and the option list supports Arrow keys plus Home and End.

Select fields can receive static `options`, or a consumer-owned async loader:

```ts
const customerField: QueryField = {
  key: 'customerId',
  label: 'Customer',
  type: 'select',
  loadOptions: async () => {
    const response = await fetch('/customers')
    return response.json()
  },
}
```

The component calls the loader when the field becomes active and displays loading, empty, and error states. Multi-select users can filter the loaded options from the search input inside the dropdown. Fetching, authorization, caching, and response mapping remain the consumer's responsibility.

## Styling

The component includes scoped SCSS styles. All selectors use readable `query-*` classes. The main neutral colors are exposed as CSS custom properties on `.query-builder`:

```css
.my-query-builder {
  --query-border: #888;
  --query-surface: #fff;
  --query-muted-surface: #f7f7f7;
  --query-text: #111;
  --query-muted-text: #555;
}
```

## Deliberate limits

This foundation uses responsive native controls and supports scalar values, date ranges, and multi-select option arrays. It does not generate SQL, validate backend semantics, or cache loaded options.
