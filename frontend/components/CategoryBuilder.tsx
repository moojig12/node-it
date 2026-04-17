'use client'

import { useState } from 'react'
import type { FieldType } from '../lib/types'

type Props = {
  onCreate: (payload: { name: string; fields: Array<{ name: string; type: FieldType; required: boolean }> }) => Promise<void>
}

const typeOptions: FieldType[] = ['text', 'number', 'currency', 'boolean', 'date']

export function CategoryBuilder({ onCreate }: Props) {
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Array<{ name: string; type: FieldType; required: boolean }>>([
    { name: 'Title', type: 'text', required: true }
  ])

  const updateField = (index: number, patch: Partial<{ name: string; type: FieldType; required: boolean }>) => {
    setFields((current) => current.map((field, i) => (i === index ? { ...field, ...patch } : field)))
  }

  const addField = () => {
    setFields((current) => [...current, { name: '', type: 'text', required: false }])
  }

  const removeField = (index: number) => {
    setFields((current) => current.filter((_, i) => i !== index))
  }

  return (
    <form
      className="card"
      onSubmit={async (event) => {
        event.preventDefault()
        const payload = {
          name: name.trim(),
          fields: fields.filter((f) => f.name.trim()).map((f) => ({ ...f, name: f.name.trim() }))
        }
        if (!payload.name || payload.fields.length === 0) return
        await onCreate(payload)
        setName('')
      }}
    >
      <h3>Create category format</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="input" />

      <div className="stack-sm">
        {fields.map((field, i) => (
          <div key={`${i}-${field.name}`} className="grid-3">
            <input
              value={field.name}
              onChange={(e) => updateField(i, { name: e.target.value })}
              placeholder="Field name"
              className="input"
            />
            <select
              className="input"
              value={field.type}
              onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(i, { required: e.target.checked })}
              />
              required
            </label>
            {fields.length > 1 && (
              <button type="button" className="button ghost" onClick={() => removeField(i)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="row gap-sm">
        <button type="button" className="button ghost" onClick={addField}>
          + Add field
        </button>
        <button type="submit" className="button primary">
          Create category
        </button>
      </div>
    </form>
  )
}
