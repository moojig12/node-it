'use client'

import { create } from 'zustand'
import { api } from './api'
import type { Category, CategoryTreeResponse, TreeNode } from './types'

type State = {
  categories: Category[]
  selectedCategoryId: string | null
  selectedNodeId: string | null
  categoryTree: CategoryTreeResponse | null
  loading: boolean
  error: string | null
  loadCategories: () => Promise<void>
  selectCategory: (categoryId: string) => Promise<void>
  createCategory: (payload: { name: string; fields: Array<{ name: string; type: string; required: boolean }> }) => Promise<void>
  createNode: (payload: { parentId: string | null; values: Array<{ fieldId: string; value: unknown }> }) => Promise<void>
  toggleNodeCollapse: (nodeId: string, collapsed: boolean) => Promise<void>
  selectNode: (nodeId: string | null) => void
}

const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node
    const nested = findNode(node.children, id)
    if (nested) return nested
  }
  return null
}

export const useAppStore = create<State>((set, get) => ({
  categories: [],
  selectedCategoryId: null,
  selectedNodeId: null,
  categoryTree: null,
  loading: false,
  error: null,

  loadCategories: async () => {
    set({ loading: true, error: null })
    try {
      const categories = await api.listCategories()
      set((state) => ({
        categories,
        selectedCategoryId: state.selectedCategoryId ?? categories[0]?.id ?? null,
        loading: false
      }))

      const selected = get().selectedCategoryId
      if (selected) await get().selectCategory(selected)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load categories', loading: false })
    }
  },

  selectCategory: async (categoryId) => {
    set({ selectedCategoryId: categoryId, selectedNodeId: null, loading: true, error: null })
    try {
      const categoryTree = await api.getCategoryTree(categoryId)
      set({ categoryTree, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load category tree', loading: false })
    }
  },

  createCategory: async (payload) => {
    set({ loading: true, error: null })
    try {
      await api.createCategory(payload)
      const categories = await api.listCategories()
      const newest = categories[categories.length - 1]
      set({ categories, selectedCategoryId: newest?.id ?? null, loading: false })
      if (newest?.id) await get().selectCategory(newest.id)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create category', loading: false })
    }
  },

  createNode: async (payload) => {
    const categoryId = get().selectedCategoryId
    if (!categoryId) return

    set({ loading: true, error: null })
    try {
      await api.createNode(categoryId, payload)
      const tree = await api.getCategoryTree(categoryId)
      set({ categoryTree: tree, loading: false })

      if (payload.parentId) {
        const parent = findNode(tree.tree, payload.parentId)
        if (parent) {
          await api.patchNodeCollapsed(parent.id, false)
          parent.collapsed = false
          set({ categoryTree: { ...tree } })
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create node', loading: false })
    }
  },

  toggleNodeCollapse: async (nodeId, collapsed) => {
    const categoryId = get().selectedCategoryId
    const existingTree = get().categoryTree
    if (!categoryId || !existingTree) return

    const node = findNode(existingTree.tree, nodeId)
    if (!node) return

    node.collapsed = collapsed
    set({ categoryTree: { ...existingTree } })

    try {
      await api.patchNodeCollapsed(nodeId, collapsed)
    } catch (error) {
      node.collapsed = !collapsed
      set({
        categoryTree: { ...existingTree },
        error: error instanceof Error ? error.message : 'Failed to update node'
      })
    }
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId })
}))
