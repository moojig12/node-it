import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');
const { aggregateSubtree } = await import(
  '../../src/services/nodeAggregate.js'
);

describe('aggregateSubtree service', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  test('null when root node does not exist', async () => {
    const result = await aggregateSubtree('000000000000000000000000');
    assert.equal(result, null);
  });

  test('count strategy counts non-null, non-empty values', async () => {
    const cat = (
      await request(app).post('/api/categories').send({
        name: 'Tasks',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'done', label: 'Done', type: 'text', aggregate: 'count' },
        ],
        identityKeys: [],
      })
    ).body;
    const root = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        values: { label: 'list', done: '' },
      })
    ).body;
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root._id,
      values: { label: 'a', done: 'x' },
    });
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root._id,
      values: { label: 'b', done: 'x' },
    });
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root._id,
      values: { label: 'c' }, // done missing
    });

    const result = await aggregateSubtree(root._id);
    assert.equal(result.nodeCount, 4);
    assert.equal(result.aggregates.done.strategy, 'count');
    // root has empty string, c has no value → only 'a' and 'b' count.
    assert.equal(result.aggregates.done.value, 2);
  });

  test('coerces numeric-like strings via $convert', async () => {
    const cat = (
      await request(app).post('/api/categories').send({
        name: 'Receipts',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'amount', label: 'Amount', type: 'currency', aggregate: 'sum' },
        ],
        identityKeys: [],
      })
    ).body;
    const root = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        values: { label: 'wallet' },
      })
    ).body;
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root._id,
      values: { label: 'coffee', amount: '4.50' },
    });
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root._id,
      values: { label: 'lunch', amount: 12 },
    });
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root._id,
      values: { label: 'junk', amount: 'not-a-number' },
    });

    const result = await aggregateSubtree(root._id);
    assert.equal(result.aggregates.amount.value, 16.5);
  });
});
