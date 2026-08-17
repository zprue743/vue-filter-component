import {
  COLLECTION_SELECT_OPERATORS,
  type QueryField,
  type QueryOption,
} from '../filter-builder'

const customers: QueryOption[] = [
  { value: '123', label: 'Acme Corp' },
  { value: '456', label: 'Example Inc' },
  { value: '789', label: 'Northwind Traders' },
]

async function loadCustomers(): Promise<QueryOption[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  return customers
}

export const demoFields: QueryField[] = [
  {
    key: 'codes',
    label: 'Codes',
    type: 'select',
    multiple: true,
    operators: COLLECTION_SELECT_OPERATORS,
    options: [
      { value: 'priority', label: 'Priority' },
      { value: 'follow-up', label: 'Follow-up' },
      { value: 'review', label: 'Review' },
    ],
  },
  {
    key: 'labels',
    label: 'Labels',
    type: 'select',
    multiple: true,
    operators: COLLECTION_SELECT_OPERATORS,
    options: [
      { value: 'label1', label: 'Label 1' },
      { value: 'label2', label: 'Label 2' },
    ],
  },
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
      { value: 'draft', label: 'Draft' },
      { value: 'in-progress', label: 'In progress' },
      { value: 'needs-review', label: 'Needs review' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'on-hold', label: 'On hold' },
      { value: 'blocked', label: 'Blocked' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'expired', label: 'Expired' },
      { value: 'archived', label: 'Archived' },
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
