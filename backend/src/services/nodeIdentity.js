import { createHash } from 'node:crypto';

/**
 * Compute a deterministic hash of a node's "identity" values — used as the
 * duplicate-key for merge-on-duplicate creates. Returns null if the category
 * has no identityKeys configured (merging disabled).
 */
export function computeIdentityHash(category, values = {}) {
  const keys = category?.identityKeys ?? [];
  if (keys.length === 0) return null;

  // Sort keys for order-independence; normalize values so trivial input
  // differences ("Bread " vs "bread") still collide.
  const payload = [...keys].sort().reduce((acc, key) => {
    acc[key] = normalize(values[key]);
    return acc;
  }, {});

  return createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

function normalize(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim().toLowerCase();
  return value;
}
