import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import {
  QueryBuilder,
  createGroup,
  type QueryField,
  type QueryGroup,
} from '../src/filter-builder'

describe('QueryBuilder', () => {
  it('renders fields supplied by the consumer and adds a condition', async () => {
    const fields: QueryField[] = [
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'revenue', label: 'Revenue', type: 'number' },
    ]
    const wrapper = mount(QueryBuilder, { props: { modelValue: createGroup(), fields } })

    expect(wrapper.classes()).toContain('query-builder')
    expect(wrapper.find('button').text()).toContain('Add condition')
    await wrapper.get('button').trigger('click')

    const updated = wrapper.emitted('update:modelValue')?.[0]?.[0] as QueryGroup
    await wrapper.setProps({ modelValue: updated })

    expect(wrapper.get('[data-testid="field-select"]').text()).toContain('Customer Name')
    expect(wrapper.get('[data-testid="field-select"]').text()).toContain('Revenue')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('forwards ordinary attributes to its root element', () => {
    const wrapper = mount(QueryBuilder, {
      props: { modelValue: createGroup(), fields: [] },
      attrs: { class: 'report-query', style: 'max-width: 40rem' },
    })

    expect(wrapper.classes()).toContain('query-builder')
    expect(wrapper.classes()).toContain('report-query')
    expect(wrapper.attributes('style')).toContain('max-width: 40rem')
  })

  it('uses externally supplied static values', () => {
    const fields: QueryField[] = [
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
    const filter = createGroup('and', [
      { id: 'status-1', kind: 'condition', field: 'status', operator: 'eq', value: '' },
    ])
    const wrapper = mount(QueryBuilder, { props: { modelValue: filter, fields } })

    expect(wrapper.get('[data-testid="value-select"]').text()).toContain('Active')
    expect(wrapper.get('[data-testid="value-select"]').text()).toContain('Inactive')
  })

  it('preserves the type of externally supplied select values', async () => {
    const fields: QueryField[] = [
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [{ value: 2, label: 'High' }],
      },
    ]
    const filter = createGroup('and', [
      { id: 'priority-1', kind: 'condition', field: 'priority', operator: 'eq', value: '' },
    ])
    const wrapper = mount(QueryBuilder, { props: { modelValue: filter, fields } })

    await wrapper.get('[data-testid="value-select"]').setValue('2')

    const updated = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as QueryGroup
    expect(updated.children[0]).toMatchObject({ value: 2 })
  })

  it('emits reactive multi-select updates through the public model', async () => {
    const fields: QueryField[] = [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'pending', label: 'Pending' },
        ],
      },
    ]
    const query = createGroup('and', [
      { id: 'status-1', kind: 'condition', field: 'status', operator: 'in', value: ['active'] },
    ])
    const wrapper = mount(QueryBuilder, { props: { modelValue: query, fields } })

    await wrapper.get('[data-testid="multi-select-trigger"]').trigger('click')
    const pendingOption = wrapper.findAll('[role="option"]').find((option) =>
      option.text().includes('Pending'),
    )
    await pendingOption?.trigger('click')

    const updated = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as QueryGroup
    expect(updated.children[0]).toMatchObject({
      operator: 'in',
      value: ['active', 'pending'],
    })
  })

  it('loads dynamic values supplied by a field', async () => {
    const loadOptions = vi.fn().mockResolvedValue([
      { value: '123', label: 'Acme Corp' },
    ])
    const fields: QueryField[] = [
      { key: 'customer', label: 'Customer', type: 'select', loadOptions },
    ]
    const filter = createGroup('and', [
      { id: 'customer-1', kind: 'condition', field: 'customer', operator: 'eq', value: '' },
    ])
    const wrapper = mount(QueryBuilder, { props: { modelValue: filter, fields } })

    await flushPromises()

    expect(loadOptions).toHaveBeenCalledWith()
    expect(wrapper.get('[data-testid="value-select"]').text()).toContain('Acme Corp')
  })

  it('shows an empty state for an empty dynamic option result', async () => {
    const fields: QueryField[] = [
      {
        key: 'customer',
        label: 'Customer',
        type: 'select',
        loadOptions: vi.fn().mockResolvedValue([]),
      },
    ]
    const filter = createGroup('and', [
      { id: 'customer-1', kind: 'condition', field: 'customer', operator: 'eq', value: '' },
    ])
    const wrapper = mount(QueryBuilder, { props: { modelValue: filter, fields } })

    await flushPromises()

    expect(wrapper.text()).toContain('No values found.')
  })

  it('emits edits, combinator changes, nested groups, and removals', async () => {
    const fields: QueryField[] = [{ key: 'name', label: 'Name', type: 'string' }]
    const filter = createGroup('and', [
      { id: 'name-1', kind: 'condition', field: 'name', operator: 'eq', value: 'old' },
    ], 'root')
    const wrapper = mount(QueryBuilder, { props: { modelValue: filter, fields } })

    await wrapper.get('[data-testid="value-input"]').setValue('new')
    const edited = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as QueryGroup
    expect(edited.children[0]).toMatchObject({ value: 'new' })

    await wrapper.setProps({ modelValue: edited })
    await wrapper.get('[data-testid="combinator-select"]').setValue('or')
    const withOr = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as QueryGroup
    expect(withOr.combinator).toBe('or')

    await wrapper.setProps({ modelValue: withOr })
    const addGroupButton = wrapper.findAll('button').find((button) => button.text() === 'Add group')
    await addGroupButton?.trigger('click')
    const withGroup = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as QueryGroup
    expect(withGroup.children[1]).toMatchObject({ kind: 'group', combinator: 'and', children: [] })

    await wrapper.setProps({ modelValue: withGroup })
    await wrapper.get('[aria-label="Remove condition"]').trigger('click')
    const removed = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as QueryGroup
    expect(removed.children).toHaveLength(1)
    expect(removed.children[0]).toMatchObject({ kind: 'group' })
  })

  it('limits nested groups from the root configuration', async () => {
    const fields: QueryField[] = [{ key: 'name', label: 'Name', type: 'string' }]
    const wrapper = mount(QueryBuilder, {
      props: {
        modelValue: createGroup('and', [], 'root'),
        fields,
        maxNestedGroupDepth: 1,
      },
    })

    const rootAddGroup = wrapper.findAll('button').find((button) => button.text() === 'Add group')
    expect(rootAddGroup?.attributes('disabled')).toBeUndefined()
    await rootAddGroup?.trigger('click')

    const withNestedGroup = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as QueryGroup
    await wrapper.setProps({ modelValue: withNestedGroup })

    const groupElements = wrapper.findAll('.query-group')
    const nestedAddGroup = groupElements[1]
      ?.findAll('button')
      .find((button) => button.text() === 'Add group')
    expect(nestedAddGroup?.attributes('disabled')).toBeDefined()
    expect(nestedAddGroup?.attributes('title')).toBe('Maximum nested group depth reached')
  })
})
