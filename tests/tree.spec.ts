import { describe, expect, it } from 'vitest'
import {
  addChild,
  createCondition,
  createGroup,
  removeNode,
  updateCondition,
  updateGroup,
  type QueryField,
} from '../src/filter-builder'

const fields: QueryField[] = [
  { key: 'name', label: 'Name', type: 'string' },
  { key: 'amount', label: 'Amount', type: 'number' },
]

describe('filter tree helpers', () => {
  it('adds and removes a condition without mutating the original tree', () => {
    const root = createGroup('and', [], 'root')
    const condition = createCondition(fields, { id: 'condition-1' })
    const added = addChild(root, root.id, condition)
    const removed = removeNode(added, condition.id)

    expect(root.children).toEqual([])
    expect(added.children).toEqual([condition])
    expect(removed.children).toEqual([])
  })

  it('changes a group from AND to OR', () => {
    const root = createGroup('and', [], 'root')
    expect(updateGroup(root, root.id, { combinator: 'or' }).combinator).toBe('or')
  })

  it('adds a nested group and preserves it while editing a condition', () => {
    const condition = createCondition(fields, {
      id: 'condition-1',
      field: 'name',
      value: 'before',
    })
    const nested = createGroup('or', [condition], 'nested')
    const root = addChild(createGroup('and', [], 'root'), 'root', nested)
    const updated = updateCondition(root, condition.id, {
      field: 'amount',
      operator: 'gte',
      value: 100,
    })

    expect(updated.children[0]).toMatchObject({
      id: 'nested',
      kind: 'group',
      combinator: 'or',
      children: [
        {
          id: 'condition-1',
          kind: 'condition',
          field: 'amount',
          operator: 'gte',
          value: 100,
        },
      ],
    })
  })

  it('round-trips nested criteria through JSON', () => {
    const root = createGroup(
      'and',
      [createGroup('or', [createCondition(fields, { id: 'condition-1' })], 'nested')],
      'root',
    )

    expect(JSON.parse(JSON.stringify(root))).toEqual(root)
  })
})
