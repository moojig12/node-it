import { useState } from 'react';
import FieldEditor from './FieldEditor.jsx';

// Controlled form for creating / editing a category. Emits a payload on save
// and lets the parent own the API call + toasts.
function CategoryForm({ initial, onSave, onCancel, busy, submitLabel = 'Save' }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [fields, setFields] = useState(
    // Clone so edits don't mutate the prop.
    (initial?.fields ?? []).map((f) => ({ ...f })),
  );
  const [identityKeys, setIdentityKeys] = useState(
    initial?.identityKeys ?? [],
  );
  const [localError, setLocalError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError('Name is required');
      return;
    }
    // Drop empty rows quietly, strip spaces on keys.
    const cleanedFields = fields
      .filter((f) => f.key.trim() && f.label.trim())
      .map((f) => ({
        key: f.key.trim(),
        label: f.label.trim(),
        type: f.type,
        aggregate: f.aggregate || null,
      }));
    const cleanedIdentity = identityKeys
      .map((k) => k.trim())
      .filter((k) => cleanedFields.some((f) => f.key === k));

    setLocalError(null);
    onSave({
      name: name.trim(),
      description: description.trim(),
      fields: cleanedFields,
      identityKeys: cleanedIdentity,
    });
  };

  return (
    <form className="card stack-md" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="cat-name">Name</label>
          <input
            id="cat-name"
            value={name}
            autoFocus
            placeholder="e.g. Groceries"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="cat-desc">Description (optional)</label>
          <input
            id="cat-desc"
            value={description}
            placeholder="What lives under this category?"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: 8 }}>Fields</h3>
        <p className="card-subtle" style={{ marginBottom: 12 }}>
          Fields define the shape of each node. Mark one or more as{' '}
          <em>identity</em> to enable merge-on-duplicate.
        </p>
        <FieldEditor
          fields={fields}
          identityKeys={identityKeys}
          onFieldsChange={setFields}
          onIdentityChange={setIdentityKeys}
        />
      </div>

      {localError && <div className="error-text">{localError}</div>}

      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
