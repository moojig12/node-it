import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';
import { notesCategoryFixture } from '../helpers/fixtures.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');

describe('Node CRUD', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  async function makeCategory() {
    const res = await request(app)
      .post('/api/categories')
      .send(notesCategoryFixture);
    return res.body;
  }

  test('POST /api/nodes creates a top-level node', async () => {
    const cat = await makeCategory();
    const res = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { title: 'Hello' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.parentId, null);
    assert.deepEqual(res.body.ancestors, []);
    assert.equal(res.body.values.title, 'Hello');
    assert.equal(res.body.identityHash, null);
  });

  test('POST rejects unknown categoryId with 400', async () => {
    const res = await request(app).post('/api/nodes').send({
      categoryId: '000000000000000000000000',
      values: {},
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /category not found/i);
  });

  test('GET /api/nodes lists nodes, sorted by order ascending', async () => {
    const cat = await makeCategory();
    const first = await request(app)
      .post('/api/nodes')
      .send({ categoryId: cat._id, values: { title: 'A' } });
    const second = await request(app)
      .post('/api/nodes')
      .send({ categoryId: cat._id, values: { title: 'B' } });

    const res = await request(app).get('/api/nodes');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0]._id, first.body._id);
    assert.equal(res.body[1]._id, second.body._id);
  });

  test('GET /api/nodes?parentId=null filters top-level', async () => {
    const cat = await makeCategory();
    const root = await request(app)
      .post('/api/nodes')
      .send({ categoryId: cat._id, values: { title: 'root' } });
    await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      parentId: root.body._id,
      values: { title: 'child' },
    });

    const res = await request(app).get('/api/nodes?parentId=null');
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].values.title, 'root');
  });

  test('PATCH /api/nodes/:id updates values', async () => {
    const cat = await makeCategory();
    const created = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { title: 'A' },
    });
    const res = await request(app)
      .patch(`/api/nodes/${created.body._id}`)
      .send({ values: { title: 'A!', body: 'edited' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.values.title, 'A!');
    assert.equal(res.body.values.body, 'edited');
  });

  test('GET /api/nodes/:id returns 404 for missing node', async () => {
    const res = await request(app).get('/api/nodes/000000000000000000000000');
    assert.equal(res.status, 404);
  });

  test('GET /api/nodes/:id returns 400 for invalid ObjectId', async () => {
    const res = await request(app).get('/api/nodes/garbage');
    assert.equal(res.status, 400);
  });

  test('DELETE /api/nodes/:id removes the node', async () => {
    const cat = await makeCategory();
    const created = await request(app).post('/api/nodes').send({
      categoryId: cat._id,
      values: { title: 'A' },
    });
    const res = await request(app).delete(`/api/nodes/${created.body._id}`);
    assert.equal(res.status, 204);
    const after = await request(app).get('/api/nodes');
    assert.equal(after.body.length, 0);
  });
});
