import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import QueryConditionEditor from '../src/filter-builder/QueryConditionEditor.vue'
import type { QueryCondition, QueryField } from '../src/filter-builder'

const condition: QueryCondition = {
  id: 'condition-1',
  kind: 'condition',
  field: 'name',
  operator: 'eq',
  value: 'Acme',
}

describe('QueryConditionEditor', () => {
  it('resets the operator and value when the selected field changes', async () => {
    const fields: QueryField[] = [
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'revenue', label: 'Revenue', type: 'number' },
    ]
    const wrapper = mount(QueryConditionEditor, { props: { condition, fields } })

    expect(wrapper.classes()).toContain('query-condition')
    await wrapper.get('[data-testid="field-select"]').setValue('revenue')

    expect(wrapper.emitted('update:condition')?.at(-1)?.[0]).toEqual({
      ...condition,
      field: 'revenue',
      operator: 'eq',
      value: null,
    })
  })

  it('converts number input to a number and can request removal', async () => {
    const fields: QueryField[] = [{ key: 'revenue', label: 'Revenue', type: 'number' }]
    const numericCondition: QueryCondition = {
      ...condition,
      field: 'revenue',
      value: null,
    }
    const wrapper = mount(QueryConditionEditor, {
      props: { condition: numericCondition, fields },
    })

    await wrapper.get('[data-testid="value-input"]').setValue('42.5')
    expect(wrapper.emitted('update:condition')?.at(-1)?.[0]).toMatchObject({ value: 42.5 })

    await wrapper.get('[aria-label="Remove condition"]').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('offers an inclusive range for dates and emits both date values', async () => {
    const fields: QueryField[] = [{ key: 'createdDate', label: 'Created Date', type: 'date' }]
    const dateCondition: QueryCondition = {
      ...condition,
      field: 'createdDate',
      operator: 'eq',
      value: '2026-08-01',
    }
    const wrapper = mount(QueryConditionEditor, {
      props: { condition: dateCondition, fields },
    })

    expect(wrapper.get('[data-testid="operator-select"]').text()).toContain('Between')
    await wrapper.get('[data-testid="operator-select"]').setValue('between')

    const betweenCondition = wrapper.emitted('update:condition')?.at(-1)?.[0] as QueryCondition
    expect(betweenCondition).toMatchObject({
      operator: 'between',
      value: ['2026-08-01', ''],
    })

    await wrapper.setProps({ condition: betweenCondition })
    expect(wrapper.find('[data-testid="value-input"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="start-date-input"]').attributes('type')).toBe('date')
    expect(wrapper.get('[data-testid="end-date-input"]').attributes('type')).toBe('date')

    await wrapper.get('[data-testid="end-date-input"]').setValue('2026-08-31')
    expect(wrapper.emitted('update:condition')?.at(-1)?.[0]).toMatchObject({
      operator: 'between',
      value: ['2026-08-01', '2026-08-31'],
    })
  })

  it('uses the range start date when changing from between to a single-date operator', async () => {
    const fields: QueryField[] = [{ key: 'createdDate', label: 'Created Date', type: 'date' }]
    const wrapper = mount(QueryConditionEditor, {
      props: {
        condition: {
          ...condition,
          field: 'createdDate',
          operator: 'between',
          value: ['2026-08-01', '2026-08-31'],
        },
        fields,
      },
    })

    await wrapper.get('[data-testid="operator-select"]').setValue('before')
    expect(wrapper.emitted('update:condition')?.at(-1)?.[0]).toMatchObject({
      operator: 'before',
      value: '2026-08-01',
    })
  })

  it('reactively adds and removes multi-select values as labeled tokens', async () => {
    const fields: QueryField[] = [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'pending', label: 'Pending review' },
        ],
      },
    ]
    const multiCondition: QueryCondition = {
      ...condition,
      field: 'status',
      operator: 'in',
      value: ['active'],
    }
    const wrapper = mount(QueryConditionEditor, {
      attachTo: document.body,
      props: { condition: multiCondition, fields },
    })

    expect(wrapper.get('[data-testid="operator-select"]').text()).toContain('Includes any of')
    expect(wrapper.get('[aria-label="Selected values"]').text()).toContain('Active')

    await wrapper.get('[data-testid="multi-select-trigger"]').trigger('click')
    expect(wrapper.findAll('button').some((button) => button.text() === 'Done')).toBe(false)
    expect(wrapper.findAll('button').some((button) => button.text() === 'Select all')).toBe(false)
    expect(wrapper.findAll('button').some((button) => button.text() === 'Clear all')).toBe(false)
    await wrapper.get('[aria-label="Search values"]').setValue('pending')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    const pendingOption = wrapper.findAll('[role="option"]').find((option) =>
      option.text().includes('Pending review'),
    )
    await pendingOption?.trigger('click')

    expect(wrapper.get('[data-testid="multi-select-trigger"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    const withPending = wrapper.emitted('update:condition')?.at(-1)?.[0] as QueryCondition
    expect(withPending.value).toEqual(['active', 'pending'])

    await wrapper.setProps({ condition: withPending })
    expect(wrapper.get('[aria-label="Selected values"]').text()).toContain('Pending review')

    await wrapper.get('[aria-label="Remove Active"]').trigger('click')
    expect(wrapper.emitted('update:condition')?.at(-1)?.[0]).toMatchObject({
      value: ['pending'],
    })

    wrapper.get('.query-multi-select').element.dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('preserves numeric option values in a multi-select condition', async () => {
    const fields: QueryField[] = [
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        multiple: true,
        options: [{ value: 2, label: 'High' }],
      },
    ]
    const wrapper = mount(QueryConditionEditor, {
      props: {
        condition: { ...condition, field: 'priority', operator: 'in', value: [] },
        fields,
      },
    })

    await wrapper.get('[data-testid="multi-select-trigger"]').trigger('click')
    await wrapper.get('[role="option"]').trigger('click')
    expect(wrapper.emitted('update:condition')?.at(-1)?.[0]).toMatchObject({ value: [2] })
  })

  it('selects visible search results and clears all multi-select values', async () => {
    const fields: QueryField[] = [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        showBulkActions: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
        ],
      },
    ]
    const wrapper = mount(QueryConditionEditor, {
      props: {
        condition: { ...condition, field: 'status', operator: 'in', value: ['pending'] },
        fields,
      },
    })

    await wrapper.get('[data-testid="multi-select-trigger"]').trigger('click')
    await wrapper.get('[aria-label="Search values"]').setValue('active')
    await wrapper.findAll('button').find((button) => button.text() === 'Select all')?.trigger('click')

    const selected = wrapper.emitted('update:condition')?.at(-1)?.[0] as QueryCondition
    expect(selected.value).toEqual(['pending', 'active', 'inactive'])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    await wrapper.setProps({ condition: selected })
    await wrapper.findAll('button').find((button) => button.text() === 'Clear all')?.trigger('click')
    expect(wrapper.emitted('update:condition')?.at(-1)?.[0]).toMatchObject({ value: [] })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
  })

  it('supports keyboard navigation and closes the multi-select with Escape', async () => {
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
    const wrapper = mount(QueryConditionEditor, {
      attachTo: document.body,
      props: {
        condition: { ...condition, field: 'status', operator: 'in', value: [] },
        fields,
      },
    })
    const trigger = wrapper.get<HTMLButtonElement>('[data-testid="multi-select-trigger"]')

    await trigger.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toContain('Active')

    await wrapper.get('[role="option"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)

    wrapper.unmount()
  })

  it('shows an error when a dynamic option loader rejects', async () => {
    const loadOptions = vi.fn().mockRejectedValue(new Error('Unavailable'))
    const fields: QueryField[] = [
      { key: 'customer', label: 'Customer', type: 'select', loadOptions },
    ]
    const selectCondition: QueryCondition = {
      ...condition,
      field: 'customer',
      value: '',
    }
    const wrapper = mount(QueryConditionEditor, {
      props: { condition: selectCondition, fields },
    })

    await flushPromises()

    expect(loadOptions).toHaveBeenCalledWith()
    expect(wrapper.find('.query-option-loader').exists()).toBe(false)
    expect(wrapper.findAll('[aria-label="Search values"]')).toHaveLength(0)
    expect(wrapper.get('[role="alert"]').text()).toBe('Values could not be loaded.')
  })

  it('loads options when an existing condition switches to a dynamic multi-select field', async () => {
    const loadOptions = vi.fn().mockResolvedValue([{ value: '123', label: 'Acme' }])
    const fields: QueryField[] = [
      { key: 'name', label: 'Name', type: 'string' },
      {
        key: 'customerId',
        label: 'Customer',
        type: 'select',
        multiple: true,
        loadOptions,
      },
    ]
    const wrapper = mount(QueryConditionEditor, { props: { condition, fields } })

    await wrapper.get('[data-testid="field-select"]').setValue('customerId')
    const updated = wrapper.emitted('update:condition')?.at(-1)?.[0] as QueryCondition
    await wrapper.setProps({ condition: updated })
    await flushPromises()

    expect(loadOptions).toHaveBeenCalledOnce()
    expect(loadOptions).toHaveBeenCalledWith()
    await wrapper.get('[data-testid="multi-select-trigger"]').trigger('click')
    expect(wrapper.text()).toContain('Acme')
    expect(wrapper.findAll('[aria-label="Search values"]')).toHaveLength(1)
  })
})
