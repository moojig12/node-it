import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';
import {
  groceriesCategoryFixture,
  notesCategoryFixture,
} from '../helpers/fixtures.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');

describe('Category HTTP surface', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  test('POST /api/categories creates a category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send(groceriesCategoryFixture);
    assert.equal(res.status, 201);
    assert.equal(res.body.name, 'Groceries');
    assert.equal(res.body.fields.length, 3);
    assert.deepEqual(res.body.identityKeys, ['name']);
    assert.ok(res.body._id);
  });

  test('POST rejects identityKeys that reference unknown fields', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ ...notesCategoryFixture, identityKeys: ['nope'] });
    // Model-level validation error → 400 via hardened error handler.
    assert.equal(res.status, 400);
    assert.match(res.body.error, /identityKeys reference unknown fields/i);
  });

  test('POST rejects missing required name via zod', async () => {
    const res = await request(app).post('/api/categories').send({ fields: [] });
    assert.equal(res.status, 400);
  });

  test('GET /api/categories lists all categories', async () => {
    await request(app).post('/api/categories').send(groceriesCategoryFixture);
    await request(app).post('/api/categories').send(notesCategoryFixture);
    const res = await request(app).get('/api/categories');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2);
  });

  test('PATCH /api/categories/:id updates fields', async () => {
    const created = await request(app)
      .post('/api/categories')
      .send(groceriesCategoryFixture);

    const res = await request(app)
      .patch(`/api/categories/${created.body._id}`)
      .send({ description: 'updated' });

    assert.equal(res.status, 200);
    assert.equal(res.body.description, 'updated');
  });

  test('GET /api/categories/:id returns 400 on invalid ObjectId (CastError)', async () => {
    const res = await request(app).get('/api/categories/not-an-id');
    assert.equal(res.status, 400);
    assert.match(res.body.error, /invalid/i);
  });

  test('DELETE /api/categories/:id blocks when nodes reference it', async () => {
    const cat = await request(app)
      .post('/api/categories')
      .send(groceriesCategoryFixture);
    await request(app)
      .post('/api/nodes')
      .send({ categoryId: cat.body._id, values: { name: 'Bread' } });

    const res = await request(app).delete(`/api/categories/${cat.body._id}`);
    assert.equal(res.status, 409);
    assert.match(res.body.error, /1 node/i);
  });

  test('DELETE /api/categories/:id?force=true cascades node deletion', async () => {
    const cat = await request(app)
      .post('/api/categories')
      .send(groceriesCategoryFixture);
    await request(app)
      .post('/api/nodes')
      .send({ categoryId: cat.body._id, values: { name: 'Bread' } });

    const res = await request(app).delete(
      `/api/categories/${cat.body._id}?force=true`,
    );
    assert.equal(res.status, 204);

    const listed = await request(app).get('/api/nodes');
    assert.equal(listed.body.length, 0);
  });

  test('DELETE on empty category returns 204', async () => {
    const cat = await request(app)
      .post('/api/categories')
      .send(notesCategoryFixture);
    const res = await request(app).delete(`/api/categories/${cat.body._id}`);
    assert.equal(res.status, 204);
  });
});
