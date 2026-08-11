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

    expect(loadOptions).toHaveBeenCalledWith(undefined)
    expect(wrapper.get('[role="alert"]').text()).toBe('Values could not be loaded.')
  })
})
