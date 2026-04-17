'use client'

import { useEffect, useMemo, useState } from 'react'
import { CategoryBuilder } from '../components/CategoryBuilder'
import { NodeEditor } from '../components/NodeEditor'
import { NodeTree } from '../components/NodeTree'
import { useAppStore } from '../lib/store'
import type { TreeNode } from '../lib/types'

const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node
    const nested = findNode(node.children, id)
    if (nested) return nested
  }
  return null
}

const flattenNode = (node: TreeNode): TreeNode[] => [node, ...node.children.flatMap(flattenNode)]

export default function Home() {
  const {
    categories,
    selectedCategoryId,
    selectedNodeId,
    categoryTree,
    loading,
    error,
    loadCategories,
    selectCategory,
    createCategory,
    createNode,
    toggleNodeCollapse,
    selectNode
  } = useAppStore()

  const [tab, setTab] = useState<'tree' | 'explorer'>('tree')

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const selectedNode = useMemo(() => {
    if (!categoryTree || !selectedNodeId) return null
    return findNode(categoryTree.tree, selectedNodeId)
  }, [categoryTree, selectedNodeId])

  const explorerRows = useMemo(() => {
    if (!categoryTree) return []
    return categoryTree.tree.flatMap(flattenNode)
  }, [categoryTree])

  return (
    <main className="layout">
      <aside className="panel stack-md">
        <h1>Node It</h1>
        <p className="muted">Structured note categories with no-code node formatting.</p>

        <CategoryBuilder onCreate={createCategory} />

        <div className="card stack-sm">
          <h3>Categories</h3>
          {categories.length === 0 && <p className="muted">No categories yet.</p>}
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-item ${selectedCategoryId === category.id ? 'active' : ''}`}
              onClick={() => selectCategory(category.id)}
            >
              <span>{category.name}</span>
              <span className="muted">{category._count?.nodes ?? 0} nodes</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="panel stack-md">
        <div className="row">
          <h2>{categoryTree ? categoryTree.name : 'Choose a category'}</h2>
          <div className="tabs">
            <button className={`button ${tab === 'tree' ? 'primary' : 'ghost'}`} onClick={() => setTab('tree')}>
              Tree view
            </button>
            <button className={`button ${tab === 'explorer' ? 'primary' : 'ghost'}`} onClick={() => setTab('explorer')}>
              Explorer
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {loading && <p className="muted">Loading…</p>}

        {categoryTree && tab === 'tree' && (
          <NodeTree
            fields={categoryTree.fields}
            nodes={categoryTree.tree}
            selectedNodeId={selectedNodeId}
            onSelect={selectNode}
            onToggle={toggleNodeCollapse}
          />
        )}

        {categoryTree && tab === 'explorer' && (
          <div className="card">
            <h3>Explorer table</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Node ID</th>
                    {categoryTree.fields.map((field) => (
                      <th key={field.id}>{field.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {explorerRows.map((node) => (
                    <tr key={node.id} onClick={() => selectNode(node.id)}>
                      <td className="mono">{node.id.slice(0, 8)}</td>
                      {categoryTree.fields.map((field) => {
                        const value = node.values.find((v) => v.fieldId === field.id)?.value
                        return <td key={field.id}>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <aside className="panel stack-md">
        {categoryTree ? (
          <NodeEditor fields={categoryTree.fields} selectedNode={selectedNode} onCreate={createNode} />
        ) : (
          <div className="card">
            <h3>Create or select category first</h3>
          </div>
        )}
      </aside>
    </main>
  )
}
