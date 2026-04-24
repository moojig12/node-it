import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { applyMergeValues } from '../../src/services/nodeMerge.js';

const category = {
  fields: [
    { key: 'name', label: 'Item', type: 'text' },
    { key: 'qty', label: 'Qty', type: 'number', aggregate: 'sum' },
    { key: 'price', label: 'Price', type: 'currency' },
  ],
};

describe('applyMergeValues', () => {
  test('sums aggregate:sum fields', () => {
    const next = applyMergeValues(
      category,
      { name: 'Bread', qty: 2, price: 5 },
      { name: 'Bread', qty: 3, price: 5 },
    );
    assert.equal(next.qty, 5);
  });

  test('keeps non-aggregate fields from the existing values', () => {
    // README example: price stays the same when duplicates merge.
    const next = applyMergeValues(
      category,
      { name: 'Bread', qty: 2, price: 5 },
      { name: 'Bread', qty: 2, price: 999 },
    );
    assert.equal(next.price, 5);
    assert.equal(next.name, 'Bread');
  });

  test('is pure — does not mutate its arguments', () => {
    const existing = { qty: 2 };
    const incoming = { qty: 3 };
    applyMergeValues(category, existing, incoming);
    assert.equal(existing.qty, 2);
    assert.equal(incoming.qty, 3);
  });

  test('treats missing or non-numeric values as 0', () => {
    const next = applyMergeValues(
      category,
      { qty: undefined },
      { qty: 'abc' },
    );
    assert.equal(next.qty, 0);
  });

  test('no aggregate fields → returns existing unchanged (shallow-copy)', () => {
    const cat = {
      fields: [{ key: 'name', label: 'N', type: 'text' }],
    };
    const next = applyMergeValues(cat, { name: 'A' }, { name: 'B' });
    assert.deepEqual(next, { name: 'A' });
  });
});
