export type FilterFieldType = 'string' | 'number' | 'date' | 'boolean' | 'select'

export type FilterScalar = string | number | boolean | null

export interface FilterOption {
  value: Exclude<FilterScalar, null>
  label: string
}

export interface FilterOperator {
  value: string
  label: string
}

export type FilterOptionLoader = (search?: string) => Promise<FilterOption[]>

export interface FilterField {
  key: string
  label: string
  type: FilterFieldType
  operators?: FilterOperator[]
  options?: FilterOption[]
  loadOptions?: FilterOptionLoader
  placeholder?: string
}

export interface FilterCondition {
  id: string
  kind: 'condition'
  field: string
  operator: string
  value: FilterScalar
}

export interface FilterGroup {
  id: string
  kind: 'group'
  combinator: 'and' | 'or'
  children: FilterNode[]
}

export type FilterNode = FilterCondition | FilterGroup
