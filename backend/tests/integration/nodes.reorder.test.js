import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';
import { notesCategoryFixture } from '../helpers/fixtures.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');

describe('POST /api/nodes/reorder', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  async function seedSiblings() {
    const cat = (
      await request(app).post('/api/categories').send(notesCategoryFixture)
    ).body;
    const a = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        values: { title: 'A' },
      })
    ).body;
    const b = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        values: { title: 'B' },
      })
    ).body;
    const c = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        values: { title: 'C' },
      })
    ).body;
    return { cat, a, b, c };
  }

  test('reorder updates order on siblings and GET reflects new sequence', async () => {
    const { a, b, c } = await seedSiblings();
    const res = await request(app)
      .post('/api/nodes/reorder')
      .send({ nodeIds: [c._id, a._id, b._id] });
    assert.equal(res.status, 200);
    assert.equal(res.body.nodes.length, 3);

    const listed = await request(app).get('/api/nodes');
    const titles = listed.body.map((n) => n.values.title);
    assert.deepEqual(titles, ['C', 'A', 'B']);
  });

  test('rejects mixed-parent reorder with 400', async () => {
    const { cat, a } = await seedSiblings();
    const nested = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: a._id,
      values: { title: 'nested' },
    });
    const res = await request(app)
      .post('/api/nodes/reorder')
      .send({ nodeIds: [a._id, nested.body._id] });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /same parent/i);
  });

  test('rejects empty nodeIds with 400', async () => {
    const res = await request(app).post('/api/nodes/reorder').send({
      nodeIds: [],
    });
    assert.equal(res.status, 400);
  });

  test('rejects when a node ID is unknown', async () => {
    const { a } = await seedSiblings();
    const res = await request(app)
      .post('/api/nodes/reorder')
      .send({ nodeIds: [a._id, '000000000000000000000000'] });
    assert.equal(res.status, 400);
  });
});
