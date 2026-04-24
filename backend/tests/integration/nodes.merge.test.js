import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';
import { groceriesCategoryFixture } from '../helpers/fixtures.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');

describe('Merge-on-duplicate create', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  async function makeGroceries() {
    const res = await request(app)
      .post('/api/categories')
      .send(groceriesCategoryFixture);
    return res.body;
  }

  test('two creates with same identity merge; sum field adds up', async () => {
    const cat = await makeGroceries();
    const first = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Bread', qty: 2, price: 5 },
    });
    const second = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Bread', qty: 2, price: 5 },
    });

    assert.equal(first.status, 201);
    assert.equal(second.status, 200); // merged, not created
    assert.equal(second.body._id, first.body._id);
    assert.equal(second.body.values.qty, 4);
    // non-aggregate field preserved
    assert.equal(second.body.values.price, 5);

    const all = await request(app).get('/api/nodes');
    assert.equal(all.body.length, 1);
  });

  test('matching name is case/whitespace insensitive', async () => {
    const cat = await makeGroceries();
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Bread', qty: 1 },
    });
    const res = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: '  BREAD ', qty: 3 },
    });
    assert.equal(res.body.values.qty, 4);
  });

  test('different identity → separate node', async () => {
    const cat = await makeGroceries();
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Bread', qty: 2 },
    });
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Milk', qty: 1 },
    });
    const all = await request(app).get('/api/nodes');
    assert.equal(all.body.length, 2);
  });

  test('merge only considers siblings with the same parent', async () => {
    const cat = await makeGroceries();
    const root = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Groceries', qty: 0 },
    });
    const childA = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root.body._id,
      values: { name: 'Bread', qty: 1 },
    });
    const childB = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: null,
      values: { name: 'Bread', qty: 1 },
    });

    // Same name, different parents → no merge. Both should exist.
    assert.notEqual(childA.body._id, childB.body._id);
    const all = await request(app).get('/api/nodes');
    assert.equal(all.body.length, 3);
  });

  test('updating values that cause identity collision returns 409', async () => {
    const cat = await makeGroceries();
    const bread = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Bread', qty: 1 },
    });
    const milk = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { name: 'Milk', qty: 1 },
    });

    const res = await request(app)
      .patch(`/api/nodes/${milk.body._id}`)
      .send({ values: { name: 'Bread', qty: 9 } });

    assert.equal(res.status, 409);
    assert.match(res.body.error, /duplicate identity/i);
    // Original two nodes should remain untouched.
    const bread2 = await request(app).get(`/api/nodes/${bread.body._id}`);
    assert.equal(bread2.body.values.qty, 1);
  });

  test('category with empty identityKeys creates each entry separately', async () => {
    const cat = await request(app).post('/api/categories').send({
      name: 'Log',
      fields: [{ key: 'msg', label: 'msg', type: 'text' }],
      identityKeys: [],
    });
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/nodes').send({
        categoryId: cat.body._id,
        values: { msg: 'same' },
      });
    }
    const all = await request(app).get('/api/nodes');
    assert.equal(all.body.length, 3);
  });
});
