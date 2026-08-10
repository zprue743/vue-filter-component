import type { FilterField, FilterOption } from '../filter-builder'

const customers: FilterOption[] = [
  { value: '123', label: 'Acme Corp' },
  { value: '456', label: 'Example Inc' },
  { value: '789', label: 'Northwind Traders' },
]

async function loadCustomers(search?: string): Promise<FilterOption[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  const query = search?.trim().toLocaleLowerCase()
  return query
    ? customers.filter((customer) => customer.label.toLocaleLowerCase().includes(query))
    : customers
}

export const demoFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' },
    ],
  },
  {
    key: 'customerId',
    label: 'Customer Name',
    type: 'select',
    loadOptions: loadCustomers,
    placeholder: 'Choose a customer',
  },
  {
    key: 'revenue',
    label: 'Revenue',
    type: 'number',
    operators: [
      { value: 'eq', label: 'Equals' },
      { value: 'gt', label: 'Greater than' },
      { value: 'gte', label: 'Greater than or equal to' },
    ],
  },
  { key: 'createdDate', label: 'Created Date', type: 'date' },
  {
    key: 'region',
    label: 'Region',
    type: 'select',
    options: [
      { value: 'east', label: 'East' },
      { value: 'west', label: 'West' },
      { value: 'central', label: 'Central' },
    ],
  },
  { key: 'isActive', label: 'Is Active', type: 'boolean' },
]
