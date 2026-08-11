import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from '../src/App.vue'

describe('App', () => {
  it('renders the demo query and keeps the JSON preview synchronized', async () => {
    const wrapper = mount(App)

    expect(wrapper.get('h1').text()).toBe('Vue filter builder')
    expect(wrapper.get('[aria-label="Query builder"]').classes()).toContain('filter-builder')

    const initialQuery = JSON.parse(wrapper.get('.json-preview pre').text())
    expect(initialQuery).toMatchObject({ id: 'root', kind: 'group', combinator: 'and' })

    await wrapper.get('[data-testid="combinator-select"]').setValue('or')

    const updatedQuery = JSON.parse(wrapper.get('.json-preview pre').text())
    expect(updatedQuery.combinator).toBe('or')
  })
})
