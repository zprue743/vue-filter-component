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

`QueryBuilder` accepts `modelValue`, `fields`, and an optional `ariaLabel`, and emits `update:modelValue`. Vue's `v-model` provides the concise form shown above. Normal attributes such as `class` and `style` are forwarded to the root element.

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

Select fields can receive static `options`, or a consumer-owned async loader:

```ts
const customerField: QueryField = {
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

The component includes scoped SCSS styles. All selectors use readable `filter-*` classes. The main neutral colors are exposed as CSS custom properties on `.filter-builder`:

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
