import { create } from 'zustand'
import type { Category } from '../types'

export type { Field, Category } from '../types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface CategoryStore {
  categories: Category[]
  loading: boolean
  error: string | null
  fetchCategories: () => Promise<void>
  addCategory: (name: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_URL}/categories`)
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data: Category[] = await res.json()
      set({ categories: data })
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  addCategory: async (name: string) => {
    set({ error: null })
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error('Failed to create category')
      await get().fetchCategories()
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  deleteCategory: async (id: string) => {
    set({ error: null })
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete category')
      await get().fetchCategories()
    } catch (err) {
      set({ error: (err as Error).message })
    }
  }
}))
