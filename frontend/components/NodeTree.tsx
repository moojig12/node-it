'use client'

import type { Field, TreeNode } from '../lib/types'

type Props = {
  fields: Field[]
  nodes: TreeNode[]
  selectedNodeId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string, collapsed: boolean) => void
}

const stringifyValue = (value: unknown) => {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return value.toString()
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

const getFieldValue = (node: TreeNode, fieldId: string) => {
  const match = node.values.find((value) => value.fieldId === fieldId)
  return match ? stringifyValue(match.value) : ''
}

function NodeItem({
  node,
  fields,
  selectedNodeId,
  onSelect,
  onToggle
}: {
  node: TreeNode
  fields: Field[]
  selectedNodeId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string, collapsed: boolean) => void
}) {
  const titleField = fields[0]
  const title = titleField ? getFieldValue(node, titleField.id) || 'Untitled node' : 'Node'

  return (
    <li>
      <div className={`node-row ${selectedNodeId === node.id ? 'active' : ''}`}>
        <button
          type="button"
          className="icon-button"
          onClick={() => onToggle(node.id, !node.collapsed)}
          aria-label={node.collapsed ? 'Expand node' : 'Collapse node'}
        >
          {node.children.length ? (node.collapsed ? '▶' : '▼') : '•'}
        </button>

        <button type="button" className="node-main" onClick={() => onSelect(node.id)}>
          <strong>{title}</strong>
          <span className="muted">{fields.slice(1, 3).map((f) => getFieldValue(node, f.id)).filter(Boolean).join(' · ')}</span>
        </button>
      </div>

      {!node.collapsed && node.children.length > 0 && (
        <ul className="tree-list nested">
          {node.children.map((child) => (
            <NodeItem
              key={child.id}
              node={child}
              fields={fields}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function NodeTree({ fields, nodes, selectedNodeId, onSelect, onToggle }: Props) {
  if (nodes.length === 0) {
    return <p className="muted">No nodes yet. Add your first node with the form on the right.</p>
  }

  return (
    <ul className="tree-list">
      {nodes.map((node) => (
        <NodeItem
          key={node.id}
          node={node}
          fields={fields}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </ul>
  )
}
