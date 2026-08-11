export type QueryFieldType = 'string' | 'number' | 'date' | 'boolean' | 'select'

export type QueryScalar = string | number | boolean | null

export interface QueryOption {
  value: Exclude<QueryScalar, null>
  label: string
}

export interface QueryOperator {
  value: string
  label: string
}

export type QueryOptionLoader = (search?: string) => Promise<QueryOption[]>

export interface QueryField {
  key: string
  label: string
  type: QueryFieldType
  operators?: QueryOperator[]
  options?: QueryOption[]
  loadOptions?: QueryOptionLoader
  placeholder?: string
}

export interface QueryCondition {
  id: string
  kind: 'condition'
  field: string
  operator: string
  value: QueryScalar
}

export interface QueryGroup {
  id: string
  kind: 'group'
  combinator: 'and' | 'or'
  children: QueryNode[]
}

export type QueryNode = QueryCondition | QueryGroup
