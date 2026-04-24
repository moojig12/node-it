import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeIdentityHash } from '../../src/services/nodeIdentity.js';

describe('computeIdentityHash', () => {
  test('returns null when the category has no identityKeys', () => {
    const hash = computeIdentityHash({ identityKeys: [] }, { name: 'Bread' });
    assert.equal(hash, null);
  });

  test('produces the same hash for the same inputs', () => {
    const category = { identityKeys: ['name'] };
    const a = computeIdentityHash(category, { name: 'Bread', qty: 2 });
    const b = computeIdentityHash(category, { name: 'Bread', qty: 999 });
    // qty isn't an identity key, so it must not affect the hash.
    assert.equal(a, b);
  });

  test('is case-insensitive and trims whitespace', () => {
    const category = { identityKeys: ['name'] };
    const a = computeIdentityHash(category, { name: 'Bread' });
    const b = computeIdentityHash(category, { name: '  BREAD ' });
    assert.equal(a, b);
  });

  test('key ordering does not change the hash', () => {
    const category = { identityKeys: ['b', 'a'] };
    const cat2 = { identityKeys: ['a', 'b'] };
    const a = computeIdentityHash(category, { a: '1', b: '2' });
    const b = computeIdentityHash(cat2, { a: '1', b: '2' });
    assert.equal(a, b);
  });

  test('different identity values produce different hashes', () => {
    const category = { identityKeys: ['name'] };
    const a = computeIdentityHash(category, { name: 'Bread' });
    const b = computeIdentityHash(category, { name: 'Milk' });
    assert.notEqual(a, b);
  });

  test('missing identity value is treated as null (still hashable)', () => {
    const category = { identityKeys: ['name'] };
    const hash = computeIdentityHash(category, {});
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 40); // sha1 hex
  });
});
