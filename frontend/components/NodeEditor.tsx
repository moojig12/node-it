'use client'

import { useMemo, useState } from 'react'
import type { Field, TreeNode } from '../lib/types'

type Props = {
  fields: Field[]
  selectedNode: TreeNode | null
  onCreate: (payload: { parentId: string | null; values: Array<{ fieldId: string; value: unknown }> }) => Promise<void>
}

const normalizeByType = (type: Field['type'], raw: string): unknown => {
  if (type === 'number' || type === 'currency') return raw === '' ? null : Number(raw)
  if (type === 'boolean') return raw === 'true'
  return raw === '' ? null : raw
}

export function NodeEditor({ fields, selectedNode, onCreate }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({})

  const payload = useMemo(
    () =>
      fields.map((field) => ({
        fieldId: field.id,
        value: normalizeByType(field.type, draft[field.id] ?? '')
      })),
    [fields, draft]
  )

  return (
    <form
      className="card"
      onSubmit={async (event) => {
        event.preventDefault()
        await onCreate({
          parentId: selectedNode?.id ?? null,
          values: payload
        })
        setDraft({})
      }}
    >
      <h3>{selectedNode ? 'Add child node' : 'Add root node'}</h3>
      <p className="muted">
        {selectedNode
          ? 'Selected node defines where the new item is inserted.'
          : 'No node selected. A root node will be created.'}
      </p>

      <div className="stack-sm">
        {fields.map((field) => (
          <label key={field.id} className="stack-xs">
            <span>
              {field.name} {field.required ? '*' : ''}
            </span>
            {field.type === 'boolean' ? (
              <select
                className="input"
                value={draft[field.id] ?? 'false'}
                onChange={(e) => setDraft((s) => ({ ...s, [field.id]: e.target.value }))}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : (
              <input
                className="input"
                type={field.type === 'date' ? 'date' : field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                step={field.type === 'currency' ? '0.01' : undefined}
                value={draft[field.id] ?? ''}
                onChange={(e) => setDraft((s) => ({ ...s, [field.id]: e.target.value }))}
                required={field.required}
              />
            )}
          </label>
        ))}
      </div>

      <button type="submit" className="button primary">
        Save node (Enter)
      </button>
    </form>
  )
}
