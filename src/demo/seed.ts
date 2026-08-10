import type { FilterGroup } from '../filter-builder'

export const initialFilter: FilterGroup = {
  id: 'root',
  kind: 'group',
  combinator: 'and',
  children: [
    {
      id: 'status-condition',
      kind: 'condition',
      field: 'status',
      operator: 'eq',
      value: 'active',
    },
    {
      id: 'created-condition',
      kind: 'condition',
      field: 'createdDate',
      operator: 'gte',
      value: '2026-01-01',
    },
    {
      id: 'region-group',
      kind: 'group',
      combinator: 'or',
      children: [
        {
          id: 'east-condition',
          kind: 'condition',
          field: 'region',
          operator: 'eq',
          value: 'east',
        },
        {
          id: 'west-condition',
          kind: 'condition',
          field: 'region',
          operator: 'eq',
          value: 'west',
        },
      ],
    },
  ],
}
