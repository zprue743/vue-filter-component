/** Controls which editor is rendered for a query field. */
export type QueryFieldType = 'string' | 'number' | 'date' | 'boolean' | 'select'

/** A JSON-safe value supported by a single query condition. */
export type QueryScalar = string | number | boolean | null

/** A non-null scalar that can identify one selectable option. */
export type QueryOptionValue = Exclude<QueryScalar, null>

/** Inclusive start and end dates stored by a date condition using the `between` operator. */
export type QueryDateRange = [startDate: string, endDate: string]

/** Values stored by a select field configured with `multiple: true`. */
export type QueryMultiValue = QueryOptionValue[]

/** A scalar comparison value, inclusive date range, or set of selected option values. */
export type QueryValue = QueryScalar | QueryDateRange | QueryMultiValue

/** A selectable value and its user-facing label. */
export interface QueryOption {
  /** Value stored in the resulting condition and sent to the backend. */
  value: QueryOptionValue
  /** Text displayed in the value selector. */
  label: string
}

/** An operator identifier and its user-facing label. */
export interface QueryOperator {
  /** Stable identifier interpreted and allow-listed by the backend. */
  value: string
  /** Text displayed in the operator selector. */
  label: string
}

/** Loads options for a select field, optionally filtered by a search term. */
export type QueryOptionLoader = (search?: string) => Promise<QueryOption[]>

/** Describes one field that users may include in a query. */
export interface QueryField {
  /** Stable field identifier stored in conditions and recognized by the backend. */
  key: string
  /** User-facing field name. */
  label: string
  /** Determines the value control and default operators. */
  type: QueryFieldType
  /** Custom operators that replace the defaults for this field. */
  operators?: QueryOperator[]
  /** Static choices for a select field. Use this or `loadOptions`. */
  options?: QueryOption[]
  /** Consumer-owned async option source for a select field. */
  loadOptions?: QueryOptionLoader
  /** Allows a select field to store multiple option values and display them as removable tokens. */
  multiple?: boolean
  /** Shows Select all and Clear all actions for a multi-select field. */
  showBulkActions?: boolean
  /** Optional hint displayed by the value control. */
  placeholder?: string
}

/** A leaf node that compares one field with a scalar value, date range, or option set. */
export interface QueryCondition {
  /** Stable identifier used when editing this node. */
  id: string
  /** Discriminator used to distinguish conditions from groups. */
  kind: 'condition'
  /** Key of the corresponding `QueryField`. */
  field: string
  /** Operator identifier supported by the selected field. */
  operator: string
  /** Comparison value. Multi-select fields store an array; date `between` stores two dates. */
  value: QueryValue
}

/** A branch that combines conditions or nested groups. */
export interface QueryGroup {
  /** Stable identifier used when editing this node. */
  id: string
  /** Discriminator used to distinguish groups from conditions. */
  kind: 'group'
  /** Whether every child or any child must match. */
  combinator: 'and' | 'or'
  /** Conditions and nested groups evaluated by this group. */
  children: QueryNode[]
}

/** Any node that may appear in a query tree. */
export type QueryNode = QueryCondition | QueryGroup
