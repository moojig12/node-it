'use client'

import { useEffect, useState } from 'react'
import type { Category } from '../types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = () => {
    setLoading(true)
    fetch(`${API_URL}/categories`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch categories')
        return res.json()
      })
      .then((data: Category[]) => {
        setCategories(data)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      })
      if (!res.ok) throw new Error('Failed to create category')
      setNewCategory('')
      fetchCategories()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Node Notes</h1>
        <p className="text-gray-500 mb-8">
          A simplistic node-based noting app for businesses and developers.
        </p>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Category List */}
        {loading ? (
          <p className="text-gray-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-400 italic">
            No categories yet. Add one above!
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((c) => (
              <li
                key={c.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-gray-800">{c.name}</span>
                  {c.fields.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">
                      {c.fields.length} field{c.fields.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-400 hover:text-red-600 text-sm transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
