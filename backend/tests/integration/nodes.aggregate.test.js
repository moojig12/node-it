import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';
import { expensesCategoryFixture } from '../helpers/fixtures.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');

describe('Subtree aggregation (GET /api/nodes/:id/aggregate)', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  // Tree:
  //   trip  (amount: 0, rating: null)
  //   ├── day1   (amount: 50, rating: 4)
  //   │   └── snack (amount: 10, rating: 3)
  //   └── day2   (amount: 90, rating: 5)
  async function seedTrip() {
    const cat = (
      await request(app).post('/api/categories').send(expensesCategoryFixture)
    ).body;
    const trip = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        values: { label: 'trip' },
      })
    ).body;
    const day1 = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        parentId: trip._id,
        values: { label: 'day1', amount: 50, rating: 4 },
      })
    ).body;
    const snack = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        parentId: day1._id,
        values: { label: 'snack', amount: 10, rating: 3 },
      })
    ).body;
    const day2 = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        parentId: trip._id,
        values: { label: 'day2', amount: 90, rating: 5 },
      })
    ).body;
    return { cat, trip, day1, snack, day2 };
  }

  test('sums amount and averages rating across subtree', async () => {
    const { trip } = await seedTrip();
    const res = await request(app).get(`/api/nodes/${trip._id}/aggregate`);
    assert.equal(res.status, 200);
    assert.equal(res.body.rootId, trip._id);
    assert.equal(res.body.nodeCount, 4);
    assert.equal(res.body.aggregates.amount.strategy, 'sum');
    assert.equal(res.body.aggregates.amount.value, 150);
    assert.equal(res.body.aggregates.rating.strategy, 'avg');
    // average of [null, 4, 3, 5] → null is excluded → (4+3+5)/3 = 4
    assert.equal(res.body.aggregates.rating.value, 4);
  });

  test('aggregates a mid-subtree root without polluting from siblings', async () => {
    const { day1 } = await seedTrip();
    const res = await request(app).get(`/api/nodes/${day1._id}/aggregate`);
    assert.equal(res.status, 200);
    assert.equal(res.body.nodeCount, 2);
    assert.equal(res.body.aggregates.amount.value, 60);
  });

  test('returns 404 when the node does not exist', async () => {
    const res = await request(app).get(
      '/api/nodes/000000000000000000000000/aggregate',
    );
    assert.equal(res.status, 404);
  });

  test('empty aggregate fields → zero values with nodeCount', async () => {
    const cat = (
      await request(app).post('/api/categories').send({
        name: 'Plain',
        fields: [{ key: 'msg', label: 'msg', type: 'text' }],
        identityKeys: [],
      })
    ).body;
    const root = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        values: { msg: 'solo' },
      })
    ).body;
    const res = await request(app).get(`/api/nodes/${root._id}/aggregate`);
    assert.equal(res.status, 200);
    assert.equal(res.body.nodeCount, 1);
    assert.deepEqual(res.body.aggregates, {});
  });
});
