import type {
  QueryCondition,
  QueryField,
  QueryFieldType,
  QueryGroup,
  QueryNode,
  QueryOperator,
  QueryScalar,
} from './types'

const DEFAULT_OPERATORS: Record<QueryFieldType, QueryOperator[]> = {
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

export function operatorsFor(field?: QueryField): QueryOperator[] {
  return field ? (field.operators ?? DEFAULT_OPERATORS[field.type]) : []
}

export function defaultValueFor(field?: QueryField): QueryScalar {
  if (!field) return null
  if (field.type === 'boolean') return true
  if (field.type === 'number') return null
  return ''
}

export function createCondition(
  fields: QueryField[],
  values: Partial<Omit<QueryCondition, 'kind'>> = {},
): QueryCondition {
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
  combinator: QueryGroup['combinator'] = 'and',
  children: QueryNode[] = [],
  id = createFilterId('group'),
): QueryGroup {
  return { id, kind: 'group', combinator, children }
}

export function addChild(root: QueryGroup, groupId: string, child: QueryNode): QueryGroup {
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

export function removeNode(root: QueryGroup, nodeId: string): QueryGroup {
  return {
    ...root,
    children: root.children
      .filter((node) => node.id !== nodeId)
      .map((node) => (node.kind === 'group' ? removeNode(node, nodeId) : node)),
  }
}

export function updateCondition(
  root: QueryGroup,
  conditionId: string,
  changes: Partial<Omit<QueryCondition, 'id' | 'kind'>>,
): QueryGroup {
  return {
    ...root,
    children: root.children.map((node) => {
      if (node.kind === 'group') return updateCondition(node, conditionId, changes)
      return node.id === conditionId ? { ...node, ...changes } : node
    }),
  }
}

export function updateGroup(
  root: QueryGroup,
  groupId: string,
  changes: Partial<Pick<QueryGroup, 'combinator'>>,
): QueryGroup {
  const updated = root.id === groupId ? { ...root, ...changes } : root

  return {
    ...updated,
    children: updated.children.map((node) =>
      node.kind === 'group' ? updateGroup(node, groupId, changes) : node,
    ),
  }
}
