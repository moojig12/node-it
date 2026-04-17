export type FieldType = 'text' | 'number' | 'currency' | 'boolean' | 'date'

export type Field = {
  id: string
  name: string
  type: FieldType
  required: boolean
}

export type Category = {
  id: string
  name: string
  fields: Field[]
  _count?: { nodes: number }
}

export type NodeValue = {
  fieldId: string
  value: unknown
}

export type TreeNode = {
  id: string
  parentId: string | null
  collapsed: boolean
  createdAt: string
  values: NodeValue[]
  children: TreeNode[]
}

export type CategoryTreeResponse = {
  id: string
  name: string
  fields: Field[]
  tree: TreeNode[]
}
