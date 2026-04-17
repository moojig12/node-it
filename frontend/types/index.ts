export interface Field {
  id: string
  name: string
  type: string
  required: boolean
  categoryId: string
}

export interface Category {
  id: string
  name: string
  fields: Field[]
  createdAt: string
}

export interface Node {
  id: string
  categoryId: string
  parentId?: string
  collapsed: boolean
  values: NodeValue[]
}

export interface NodeValue {
  id: string
  nodeId: string
  fieldId: string
  value: unknown
}
