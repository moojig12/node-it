import { useState } from 'react';

/**
 * Editor for a category's fields[] array.
 *
 * Two zones:
 *   - Field list:  one compact line per committed field with edit / remove
 *                  actions. Pencil expands the row into an inline editor.
 *   - Draft area:  a single always-visible input zone for the next field to
 *                  add. "+ add field" commits the draft into the list above
 *                  and resets the draft to blank, ready for another entry.
 *
 * The component is controlled — the parent owns `fields` and `identityKeys`
 * and gets change events. Local state is only for editor UI (which row is
 * expanded, the in-progress draft).
 */

const FIELD_TYPES = ['text', 'number', 'currency', 'date', 'boolean'];
const AGGREGATE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'sum', label: 'sum' },
  { value: 'avg', label: 'avg' },
  { value: 'count', label: 'count' },
];

function blankField() {
  return { key: '', label: '', type: 'text', aggregate: null };
}

function blankDraft() {
  return { ...blankField(), identity: false };
}

// Keep keys consistent with what the backend uses when computing identity.
function cleanKey(k) {
  return k.trim();
}

function FieldEditor({ fields, identityKeys, onFieldsChange, onIdentityChange }) {
  const [draft, setDraft] = useState(blankDraft);
  const [editingIdx, setEditingIdx] = useState(null);

  const updateField = (idx, patch) => {
    const oldField = fields[idx];
    const next = fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    onFieldsChange(next);

    // If the key was renamed and the old key was an identity key, follow the
    // rename so the identity array stays in sync. The submit-time filter
    // would drop orphans anyway, but the live UI looks more honest this way.
    if (
      Object.prototype.hasOwnProperty.call(patch, 'key') &&
      oldField.key !== patch.key
    ) {
      const oldClean = cleanKey(oldField.key);
      const newClean = cleanKey(patch.key);
      if (oldClean && identityKeys.includes(oldClean)) {
        onIdentityChange(
          identityKeys
            .map((k) => (k === oldClean ? newClean : k))
            .filter(Boolean),
        );
      }
    }
  };

  const removeField = (idx) => {
    const removedKey = cleanKey(fields[idx].key);
    onFieldsChange(fields.filter((_, i) => i !== idx));
    if (removedKey && identityKeys.includes(removedKey)) {
      onIdentityChange(identityKeys.filter((k) => k !== removedKey));
    }
    if (editingIdx === idx) setEditingIdx(null);
  };

  const toggleIdentityFor = (key) => {
    const clean = cleanKey(key);
    if (!clean) return;
    onIdentityChange(
      identityKeys.includes(clean)
        ? identityKeys.filter((k) => k !== clean)
        : [...identityKeys, clean],
    );
  };

  // ---- draft validation ----
  const draftKey = cleanKey(draft.key);
  const draftLabel = draft.label.trim();
  const draftKeyTaken = !!draftKey && fields.some((f) => cleanKey(f.key) === draftKey);
  const draftReady = draftKey && draftLabel && !draftKeyTaken;

  const commitDraft = () => {
    if (!draftReady) return;
    onFieldsChange([
      ...fields,
      {
        key: draftKey,
        label: draftLabel,
        type: draft.type,
        aggregate: draft.aggregate || null,
      },
    ]);
    if (draft.identity) {
      onIdentityChange([...identityKeys, draftKey]);
    }
    setDraft(blankDraft());
  };

  // Submit on Enter from any draft input — keeps the rapid-add flow snappy.
  const onDraftKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitDraft();
    }
  };

  return (
    <div className="field-editor">
      {fields.length > 0 ? (
        <ul className="field-list">
          {fields.map((field, idx) => {
            const cleaned = cleanKey(field.key);
            const isIdentity = !!cleaned && identityKeys.includes(cleaned);
            const isEditing = editingIdx === idx;

            if (isEditing) {
              return (
                <li key={idx} className="field-list-item editing">
                  <FieldInputs
                    field={field}
                    onChange={(patch) => updateField(idx, patch)}
                  />
                  <div className="field-row-actions">
                    <button
                      type="button"
                      className={isIdentity ? 'primary' : 'btn-ghost'}
                      disabled={!cleaned}
                      onClick={() => toggleIdentityFor(field.key)}
                      title="Identity fields drive merge-on-duplicate"
                    >
                      {isIdentity ? '✓ identity' : 'mark as identity'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIdx(null)}
                    >
                      Done
                    </button>
                  </div>
                </li>
              );
            }

            return (
              <li key={idx} className="field-list-item">
                <div className="field-summary" title={`${field.key} → ${field.label}`}>
                  <span className="fs-key">{field.key || <em className="muted">no key</em>}</span>
                  <span className="fs-sep">·</span>
                  <span className="fs-label">{field.label || <em className="muted">no label</em>}</span>
                  <span className="fs-type">{field.type}</span>
                  {field.aggregate && (
                    <span className="fs-agg">{field.aggregate}</span>
                  )}
                  {isIdentity && (
                    <span className="identity-pill">identity</span>
                  )}
                </div>
                <div className="field-row-actions">
                  <button
                    type="button"
                    className="field-icon-btn"
                    onClick={() => setEditingIdx(idx)}
                    title="Edit field"
                    aria-label={`Edit ${field.label || field.key}`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="field-icon-btn field-icon-danger"
                    onClick={() => removeField(idx)}
                    title="Remove field"
                    aria-label={`Remove ${field.label || field.key}`}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="field-empty muted">
          No fields yet — fill in the form below to add the first one.
        </div>
      )}

      <div className="field-draft" onKeyDown={onDraftKeyDown}>
        <div className="field-draft-head">
          <h4 className="field-draft-title">Add a field</h4>
          {draftKeyTaken && (
            <span className="error-text" role="alert">
              Key already used
            </span>
          )}
        </div>
        <FieldInputs
          field={draft}
          onChange={(patch) => setDraft({ ...draft, ...patch })}
        />
        <label className="field-identity-check">
          <input
            type="checkbox"
            checked={draft.identity}
            onChange={(e) => setDraft({ ...draft, identity: e.target.checked })}
          />
          <span>Use as identity (merge-on-duplicate)</span>
        </label>
        <div className="field-draft-actions">
          <button
            type="button"
            className="primary"
            disabled={!draftReady}
            onClick={commitDraft}
          >
            + add field
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable 4-input row used for both the inline edit of a committed field
 * and the draft. Stateless — receives a `field` object and an `onChange`.
 */
function FieldInputs({ field, onChange }) {
  return (
    <div className="field-inputs">
      <label className="field-input-group">
        <span className="field-input-label">Key</span>
        <input
          value={field.key}
          placeholder="e.g. name"
          onChange={(e) => onChange({ key: e.target.value })}
        />
      </label>
      <label className="field-input-group">
        <span className="field-input-label">Label</span>
        <input
          value={field.label}
          placeholder="Display label"
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </label>
      <label className="field-input-group">
        <span className="field-input-label">Type</span>
        <select
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="field-input-group">
        <span className="field-input-label">Aggregate</span>
        <select
          value={field.aggregate ?? ''}
          onChange={(e) => onChange({ aggregate: e.target.value || null })}
        >
          {AGGREGATE_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default FieldEditor;
