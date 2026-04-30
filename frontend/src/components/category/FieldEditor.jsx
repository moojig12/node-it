// Editor for a category's fields[] array. Fully controlled — the parent
// owns the fields list and identityKeys, this component just renders rows
// and emits change events.

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

// Normalize a key the same way the backend does for identity — avoids
// "nope" vs "Nope" mismatches when you toggle the identity pill.
function cleanKey(k) {
  return k.trim();
}

function FieldEditor({ fields, identityKeys, onFieldsChange, onIdentityChange }) {
  const updateField = (idx, patch) => {
    const next = fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    onFieldsChange(next);
  };

  const removeField = (idx) => {
    const removedKey = cleanKey(fields[idx].key);
    onFieldsChange(fields.filter((_, i) => i !== idx));
    if (removedKey && identityKeys.includes(removedKey)) {
      onIdentityChange(identityKeys.filter((k) => k !== removedKey));
    }
  };

  const toggleIdentity = (key) => {
    const clean = cleanKey(key);
    if (!clean) return;
    onIdentityChange(
      identityKeys.includes(clean)
        ? identityKeys.filter((k) => k !== clean)
        : [...identityKeys, clean],
    );
  };

  const addField = () => onFieldsChange([...fields, blankField()]);

  return (
    <div className="stack-sm">
      {/* <div className="field-row field-row-header">
        <span>Key</span>
        <span>Label</span>
        <span>Type</span>
        <span>Aggregate</span>
        <span />
      </div> */}

      {fields.length === 0 && (
        <div className="muted">No fields yet — add at least one.</div>
      )}

      {fields.map((field, idx) => {
        const cleanedKey = cleanKey(field.key);
        const isIdentity = cleanedKey && identityKeys.includes(cleanedKey);
        return (
          <div key={idx} className="stack-sm">
            <div className="field-row">
			<div className="field-row-header">Key</div>
              <input
                value={field.key}
                placeholder="e.g. name"
                onChange={(e) => updateField(idx, { key: e.target.value })}
              />
			  <div className="field-row-header">Label</div>
              <input 
                value={field.label}
                placeholder="Display label"
                onChange={(e) => updateField(idx, { label: e.target.value })}
              />
			  <div className="field-row-header">Type</div>
              <select
				
                value={field.type}
                onChange={(e) => updateField(idx, { type: e.target.value })}
              >
				
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
			  <div className="field-row-header">Aggregate</div>
              <select
			 	
                value={field.aggregate ?? ''}
                onChange={(e) =>
                  updateField(idx, { aggregate: e.target.value || null })
                }
              >
                {AGGREGATE_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-ghost"
                title="Remove field"
                onClick={() => removeField(idx)}
              >
                ×
              </button>
            </div>
            <div className="btn-row" style={{ paddingLeft: 2 }}>
              <button
                type="button"
                className={isIdentity ? 'primary' : 'btn-ghost'}
                disabled={!cleanedKey}
                onClick={() => toggleIdentity(field.key)}
                title="Fields marked identity drive merge-on-duplicate"
              >
                {isIdentity ? '✓ identity' : 'mark as identity'}
              </button>
              {isIdentity && (
                <span className="identity-pill">merge-on-duplicate</span>
              )}
            </div>
          </div>
        );
      })}

      <div className="btn-row">
        <button type="button" onClick={addField}>
          + add field
        </button>
      </div>
    </div>
  );
}

export default FieldEditor;
