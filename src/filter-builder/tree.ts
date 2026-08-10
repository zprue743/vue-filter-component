import type {
  FilterCondition,
  FilterField,
  FilterFieldType,
  FilterGroup,
  FilterNode,
  FilterOperator,
  FilterScalar,
} from './types'

const DEFAULT_OPERATORS: Record<FilterFieldType, FilterOperator[]> = {
  string: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
  ],
  number: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Does not equal' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater than or equal to' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less than or equal to' },
  ],
  date: [
    { value: 'eq', label: 'On' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'gte', label: 'On or after' },
    { value: 'lte', label: 'On or before' },
  ],
  boolean: [
    { value: 'eq', label: 'Is' },
  ],
  select: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Does not equal' },
  ],
}

let fallbackId = 0

export function createFilterId(prefix: 'condition' | 'group'): string {
  const randomId = globalThis.crypto?.randomUUID?.()
  return randomId ? `${prefix}-${randomId}` : `${prefix}-${++fallbackId}`
}

export function operatorsFor(field?: FilterField): FilterOperator[] {
  return field ? (field.operators ?? DEFAULT_OPERATORS[field.type]) : []
}

export function defaultValueFor(field?: FilterField): FilterScalar {
  if (!field) return null
  if (field.type === 'boolean') return true
  if (field.type === 'number') return null
  return ''
}

export function createCondition(
  fields: FilterField[],
  values: Partial<Omit<FilterCondition, 'kind'>> = {},
): FilterCondition {
  const field = fields.find((candidate) => candidate.key === values.field) ?? fields[0]
  const operator = values.operator ?? operatorsFor(field)[0]?.value ?? ''

  return {
    id: values.id ?? createFilterId('condition'),
    kind: 'condition',
    field: values.field ?? field?.key ?? '',
    operator,
    value: values.value ?? defaultValueFor(field),
  }
}

export function createGroup(
  combinator: FilterGroup['combinator'] = 'and',
  children: FilterNode[] = [],
  id = createFilterId('group'),
): FilterGroup {
  return { id, kind: 'group', combinator, children }
}

export function addChild(root: FilterGroup, groupId: string, child: FilterNode): FilterGroup {
  if (root.id === groupId) {
    return { ...root, children: [...root.children, child] }
  }

  return {
    ...root,
    children: root.children.map((node) =>
      node.kind === 'group' ? addChild(node, groupId, child) : node,
    ),
  }
}

export function removeNode(root: FilterGroup, nodeId: string): FilterGroup {
  return {
    ...root,
    children: root.children
      .filter((node) => node.id !== nodeId)
      .map((node) => (node.kind === 'group' ? removeNode(node, nodeId) : node)),
  }
}

export function updateCondition(
  root: FilterGroup,
  conditionId: string,
  changes: Partial<Omit<FilterCondition, 'id' | 'kind'>>,
): FilterGroup {
  return {
    ...root,
    children: root.children.map((node) => {
      if (node.kind === 'group') return updateCondition(node, conditionId, changes)
      return node.id === conditionId ? { ...node, ...changes } : node
    }),
  }
}

export function updateGroup(
  root: FilterGroup,
  groupId: string,
  changes: Partial<Pick<FilterGroup, 'combinator'>>,
): FilterGroup {
  const updated = root.id === groupId ? { ...root, ...changes } : root

  return {
    ...updated,
    children: updated.children.map((node) =>
      node.kind === 'group' ? updateGroup(node, groupId, changes) : node,
    ),
  }
}
