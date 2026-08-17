import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QueryGroupEditor from '../src/filter-builder/QueryGroupEditor.vue'
import { createGroup, type QueryField, type QueryGroup } from '../src/filter-builder'

const fields: QueryField[] = [{ key: 'name', label: 'Name', type: 'string' }]

describe('QueryGroupEditor', () => {
  it('emits immutable replacements when its combinator or children change', async () => {
    const group = createGroup(
      'and',
      [{ id: 'name-1', kind: 'condition', field: 'name', operator: 'eq', value: 'old' }],
      'root',
    )
    const wrapper = mount(QueryGroupEditor, { props: { group, fields, root: true } })

    expect(wrapper.classes()).toContain('query-group')
    await wrapper.get('[data-testid="combinator-select"]').setValue('or')
    expect(wrapper.emitted('update:group')?.at(-1)?.[0]).toMatchObject({ combinator: 'or' })

    await wrapper.get('[data-testid="value-input"]').setValue('new')
    const edited = wrapper.emitted('update:group')?.at(-1)?.[0] as QueryGroup

    expect(edited.children[0]).toMatchObject({ id: 'name-1', value: 'new' })
    expect(group.children[0]).toMatchObject({ value: 'old' })
  })

  it('adds conditions and nested groups using the available fields', async () => {
    const wrapper = mount(QueryGroupEditor, {
      props: { group: createGroup('and', [], 'root'), fields, root: true },
    })

    expect(wrapper.props('maxNestedGroupDepth')).toBe(15)
    const addCondition = wrapper.findAll('button').find((button) => button.text() === 'Add condition')
    await addCondition?.trigger('click')

    const withCondition = wrapper.emitted('update:group')?.at(-1)?.[0] as QueryGroup
    expect(withCondition.children[0]).toMatchObject({
      kind: 'condition',
      field: 'name',
      operator: 'eq',
    })

    await wrapper.setProps({ group: withCondition })
    const addGroup = wrapper.findAll('button').find((button) => button.text() === 'Add group')
    await addGroup?.trigger('click')

    const withGroup = wrapper.emitted('update:group')?.at(-1)?.[0] as QueryGroup
    expect(withGroup.children[1]).toMatchObject({
      kind: 'group',
      combinator: 'and',
      children: [],
    })
  })

  it('allows nested groups to request removal but protects the root group', async () => {
    const nested = mount(QueryGroupEditor, {
      props: { group: createGroup('and', [], 'nested'), fields },
    })

    await nested.get('[aria-label="Remove group"]').trigger('click')
    expect(nested.emitted('remove')).toHaveLength(1)

    const root = mount(QueryGroupEditor, {
      props: { group: createGroup('and', [], 'root'), fields, root: true },
    })
    expect(root.find('[aria-label="Remove group"]').exists()).toBe(false)
  })

  it('disables adding a group at the configured depth limit', () => {
    const wrapper = mount(QueryGroupEditor, {
      props: {
        group: createGroup('and', [], 'nested'),
        fields,
        depth: 2,
        maxNestedGroupDepth: 2,
      },
    })

    const addGroup = wrapper.findAll('button').find((button) => button.text() === 'Add group')
    expect(addGroup?.attributes('disabled')).toBeDefined()
  })
})
