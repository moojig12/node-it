import type { Category, CategoryTreeResponse } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const ensure = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  listCategories: () => fetch(`${API_BASE}/categories`).then((r) => ensure<Category[]>(r)),
  createCategory: (payload: { name: string; fields: Array<{ name: string; type: string; required: boolean }> }) =>
    fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then((r) => ensure<Category>(r)),
  getCategoryTree: (categoryId: string) =>
    fetch(`${API_BASE}/categories/${categoryId}/tree`).then((r) => ensure<CategoryTreeResponse>(r)),
  createNode: (categoryId: string, payload: { parentId: string | null; values: Array<{ fieldId: string; value: unknown }> }) =>
    fetch(`${API_BASE}/categories/${categoryId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then((r) => ensure<unknown>(r)),
  patchNodeCollapsed: (nodeId: string, collapsed: boolean) =>
    fetch(`${API_BASE}/nodes/${nodeId}/collapse`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collapsed })
    }).then((r) => ensure<unknown>(r))
}
