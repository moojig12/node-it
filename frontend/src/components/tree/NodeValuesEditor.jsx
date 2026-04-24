// Renders one input per category field, type-aware. Fully controlled —
// the parent keeps the `values` object and passes onChange.
//
// Types map to input element like so:
//   text      → <input type="text">
//   number    → <input type="number" step="any">
//   currency  → <input type="number" step="0.01">
//   date      → <input type="date">
//   boolean   → <input type="checkbox">

function inputForType(type) {
  switch (type) {
    case 'number':
      return { type: 'number', step: 'any' };
    case 'currency':
      return { type: 'number', step: '0.01' };
    case 'date':
      return { type: 'date' };
    case 'boolean':
      return { type: 'checkbox' };
    default:
      return { type: 'text' };
  }
}

function NodeValuesEditor({ fields, values, onChange, onSubmit, onCancel, submitLabel = 'Save' }) {
  const update = (key, v) => onChange({ ...values, [key]: v });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
  };

  return (
    <div className="inline-editor" onKeyDown={handleKeyDown}>
      {fields.map((field) => {
        const props = inputForType(field.type);
        if (field.type === 'boolean') {
          return (
            <label
              key={field.key}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <input
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(e) => update(field.key, e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>{field.label}</span>
            </label>
          );
        }
        return (
          <input
            key={field.key}
            {...props}
            placeholder={field.label}
            value={values[field.key] ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              const next =
                field.type === 'number' || field.type === 'currency'
                  ? raw === ''
                    ? ''
                    : Number(raw)
                  : raw;
              update(field.key, next);
            }}
          />
        );
      })}
      <div className="btn-row">
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="primary" onClick={onSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default NodeValuesEditor;
