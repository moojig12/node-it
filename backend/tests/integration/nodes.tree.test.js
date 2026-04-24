import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setupDb, teardownDb, resetDb } from '../helpers/db.js';
import { notesCategoryFixture } from '../helpers/fixtures.js';

const { default: request } = await import('supertest');
const { default: app } = await import('../../src/app.js');

describe('Tree operations (ancestors, move, subtree, delete cascade)', () => {
  before(setupDb);
  after(teardownDb);
  beforeEach(resetDb);

  // Shape:
  //   root
  //   ├── childA
  //   │   └── grand
  //   └── childB
  async function seedTree() {
    const cat = (
      await request(app).post('/api/categories').send(notesCategoryFixture)
    ).body;
    const root = (
      await request(app)
        .post('/api/nodes')
        .send({ categoryId: cat._id, values: { title: 'root' } })
    ).body;
    const childA = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        parentId: root._id,
        values: { title: 'A' },
      })
    ).body;
    const childB = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        parentId: root._id,
        values: { title: 'B' },
      })
    ).body;
    const grand = (
      await request(app).post('/api/nodes').send({
        categoryId: cat._id,
        parentId: childA._id,
        values: { title: 'grand' },
      })
    ).body;
    return { cat, root, childA, childB, grand };
  }

  test('ancestors are populated on create', async () => {
    const { root, childA, grand } = await seedTree();
    assert.deepEqual(root.ancestors, []);
    assert.deepEqual(childA.ancestors, [root._id]);
    assert.deepEqual(grand.ancestors, [root._id, childA._id]);
  });

  test('GET /api/nodes/:id/subtree returns root + all descendants', async () => {
    const { root } = await seedTree();
    const res = await request(app).get(`/api/nodes/${root._id}/subtree`);
    assert.equal(res.status, 200);
    assert.equal(res.body.root._id, root._id);
    assert.equal(res.body.descendants.length, 3);
  });

  test('PATCH reparents a node and cascades ancestors to descendants', async () => {
    const { root, childA, childB, grand } = await seedTree();

    // Move childA under childB.
    const res = await request(app)
      .patch(`/api/nodes/${childA._id}`)
      .send({ parentId: childB._id });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.ancestors, [root._id, childB._id]);

    // Grand should now be 3 levels deep: root → B → A → grand.
    const grandAfter = await request(app).get(`/api/nodes/${grand._id}`);
    assert.deepEqual(grandAfter.body.ancestors, [
      root._id,
      childB._id,
      childA._id,
    ]);
  });

  test('PATCH can promote a node to top-level by setting parentId: null', async () => {
    const { childA } = await seedTree();
    const res = await request(app)
      .patch(`/api/nodes/${childA._id}`)
      .send({ parentId: null });
    assert.equal(res.status, 200);
    assert.equal(res.body.parentId, null);
    assert.deepEqual(res.body.ancestors, []);
  });

  test('PATCH blocks moving a node beneath itself or a descendant', async () => {
    const { childA, grand } = await seedTree();
    const res = await request(app)
      .patch(`/api/nodes/${childA._id}`)
      .send({ parentId: grand._id });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /beneath itself/i);
  });

  test('PATCH with non-existent target parent returns 400', async () => {
    const { childA } = await seedTree();
    const res = await request(app)
      .patch(`/api/nodes/${childA._id}`)
      .send({ parentId: '000000000000000000000000' });
    assert.equal(res.status, 400);
  });

  test('DELETE cascades to the whole subtree', async () => {
    const { root } = await seedTree();
    const res = await request(app).delete(`/api/nodes/${root._id}`);
    assert.equal(res.status, 204);
    const remaining = await request(app).get('/api/nodes');
    assert.equal(remaining.body.length, 0);
  });

  test('DELETE of a mid-tree node removes only its own subtree', async () => {
    const { childA, root, childB } = await seedTree();
    const res = await request(app).delete(`/api/nodes/${childA._id}`);
    assert.equal(res.status, 204);

    const remaining = await request(app).get('/api/nodes');
    const ids = remaining.body.map((n) => n._id);
    assert.deepEqual(ids.sort(), [root._id, childB._id].sort());
  });
});
