/**
 * Merge an incoming create payload into an existing node's values.
 * For fields with `aggregate: 'sum'` the numeric values add up; all other
 * fields keep the existing value (identity fields by definition already match).
 *
 * Pure — returns the new values object, does not mutate inputs.
 */
export function applyMergeValues(category, existingValues = {}, incomingValues = {}) {
  const next = { ...existingValues };

  for (const field of category.fields ?? []) {
    if (field.aggregate === 'sum') {
      const current = toNumber(next[field.key]);
      const incoming = toNumber(incomingValues[field.key]);
      next[field.key] = current + incoming;
    }
    // Non-sum fields intentionally keep the original value.
  }

  return next;
}

function toNumber(value) {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
